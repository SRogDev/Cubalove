/**
 * Cubalove — AI Weekly Recommendation Service
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ALGORITHM: Dual-Embedding Cross-Compatibility
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Every user has TWO vectors (1536 dims, gemini-embedding-exp-03-07):
 *
 *   profile_embedding  → WHO this user IS
 *                        Input: bio + interests + prompts + demographics
 *                        Task type: RETRIEVAL_DOCUMENT
 *
 *   ideal_embedding    → WHO this user WANTS
 *                        Input: show_me + ideal_partner_description + interests
 *                        Task type: RETRIEVAL_QUERY
 *
 * Compatibility scores (0.0 – 1.0):
 *   score_A→B = cosine_similarity(A.ideal_embedding, B.profile_embedding)
 *               "Does B match what A is looking for?"
 *
 *   score_B→A = cosine_similarity(B.ideal_embedding, A.profile_embedding)
 *               "Does A match what B is looking for?"
 *
 *   compatibility = (score_A→B + score_B→A) / 2
 *
 * A pair is recommended ONLY when BOTH directional scores ≥ MATCH_THRESHOLD.
 * This enforces the cross-recommendation guarantee: if I recommend B to you,
 * I also recommend you to B — because both found each other mutually fitting.
 *
 * Cooldown: Pairs that were recommended in the last 8 weeks are skipped.
 *
 * Scalability note:
 *   Current implementation is N²/2 in-memory similarity (acceptable ~10k users).
 *   At scale, swap to pgvector ANN: for each user, query top-50 via
 *   `<=>` (cosine distance op) and intersect results to find cross-pairs.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { createHash } from "crypto";
import * as RecommendationsRepo from "@/lib/repositories/recommendations";
import type { UserEmbeddingRow } from "@/lib/repositories/recommendations";
import type { Gender, ShowMe } from "@/lib/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Minimum directional cosine similarity for a recommendation to be formed */
const MATCH_THRESHOLD = 0.75;

/** Top N recommendations per user */
const TOP_N = 5;

/** Only process users active in the last 30 days */
const ACTIVE_WITHIN_DAYS = 30;

/** Google embedding model (1536 dimensions) */
const EMBEDDING_MODEL = google.textEmbeddingModel("gemini-embedding-exp-03-07");

// ---------------------------------------------------------------------------
// Text builders — the quality of these texts is critical to recommendation quality
// ---------------------------------------------------------------------------

interface UserForEmbedding {
  user_id: string;
  display_name: string;
  date_of_birth: string;
  gender: Gender;
  show_me: ShowMe;
  bio: string | null;
  work_study: string | null;
  interests: string[];
  prompts: Array<{ prompt_text: string; answer_text: string }>;
  ideal_partner_description: string | null;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Builds the "who I am" document text for profile_embedding.
 * Used as RETRIEVAL_DOCUMENT — to be matched against ideal queries.
 */
export function buildProfileText(user: UserForEmbedding): string {
  const age = getAge(user.date_of_birth);
  const genderLabel = user.gender === "hombre" ? "hombre" : user.gender === "mujer" ? "mujer" : "persona no binaria";

  const parts: string[] = [
    `Soy ${genderLabel} de ${age} años.`,
  ];

  if (user.bio) parts.push(`Sobre mí: ${user.bio}`);
  if (user.work_study) parts.push(`Trabajo/Estudios: ${user.work_study}`);
  if (user.interests.length > 0) parts.push(`Mis intereses: ${user.interests.join(", ")}.`);

  for (const p of user.prompts) {
    parts.push(`${p.prompt_text}: ${p.answer_text}`);
  }

  return parts.join(" ");
}

/**
 * Builds the "who I want" query text for ideal_embedding.
 * Used as RETRIEVAL_QUERY — what this person is searching for.
 *
 * Returns null when the user has NOT written an ideal partner description.
 * Without a real description the embedding would only reflect the user's own
 * interests (creating a "find someone like me" bias instead of "find who I
 * actually want"). Users without a description are excluded from the weekly
 * calculation — this is intentional: filling in the description is required
 * to receive and appear in cross-recommendations.
 */
export function buildIdealText(user: UserForEmbedding): string | null {
  if (!user.ideal_partner_description?.trim()) {
    // No description → can't build a meaningful ideal query without bias.
    // Returning null signals the algorithm to skip this user.
    return null;
  }

  const showMeLabel: Record<ShowMe, string> = {
    hombres: "un hombre",
    mujeres: "una mujer",
    ambos: "una persona (hombre o mujer)",
  };

  const parts: string[] = [
    `Busco conectar con ${showMeLabel[user.show_me]}.`,
    `La persona ideal para mí: ${user.ideal_partner_description.trim()}`,
  ];

  // Interests give useful semantic context for the ideal ("I want someone who
  // shares these things with me") WITHOUT assuming they want a clone of
  // themselves — the free-text description anchors the real preferences first.
  if (user.interests.length > 0) {
    parts.push(`También valoro que comparta: ${user.interests.join(", ")}.`);
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Gender compatibility pre-filter
// ---------------------------------------------------------------------------

/**
 * Returns true if a potential match is valid based on mutual gender preferences.
 * Both parties must include the other's gender in their show_me preference.
 */
function isGenderCompatible(
  genderA: Gender,
  showMeA: ShowMe,
  genderB: Gender,
  showMeB: ShowMe,
): boolean {
  const aWantsB =
    showMeA === "ambos" ||
    (showMeA === "hombres" && genderB === "hombre") ||
    (showMeA === "mujeres" && genderB === "mujer");

  const bWantsA =
    showMeB === "ambos" ||
    (showMeB === "hombres" && genderA === "hombre") ||
    (showMeB === "mujeres" && genderA === "mujer");

  return aWantsB && bWantsA;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

// ---------------------------------------------------------------------------
// Embedding generation (batched to respect rate limits)
// ---------------------------------------------------------------------------

const EMBED_BATCH_SIZE = 20;

async function generateEmbeddingsBatched(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: batch,
    });
    results.push(...embeddings);

    // Brief pause between batches to avoid rate limits
    if (i + EMBED_BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export interface WeeklyCalculationResult {
  usersProcessed: number;
  embeddingsGenerated: number;
  pairsEvaluated: number;
  pairsRecommended: number;
  error: string | null;
}

/**
 * Full weekly recommendation calculation pipeline.
 *
 * Phase 1 — Load eligible users + current embeddings
 * Phase 2 — Regenerate embeddings for users whose profile changed
 * Phase 3 — In-memory N²/2 cosine similarity + cross-pair filtering
 * Phase 4 — Insert new recommendations, archive old ones
 */
export async function calculateWeeklyRecommendations(): Promise<WeeklyCalculationResult> {
  // Use service_role client — needs full cross-user access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let embeddingsGenerated = 0;

  try {
    // ── Phase 1: Load eligible users ───────────────────────────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ACTIVE_WITHIN_DAYS);

    const { data: rawUsers, error: usersError } = await supabase
      .from("users")
      .select(`
        user_id, display_name, date_of_birth, gender, show_me, bio, work_study, last_active,
        user_interests (interest),
        user_prompts (prompt_text, answer_text, position),
        user_embeddings (
          profile_embedding, ideal_embedding,
          profile_text_hash, ideal_text_hash, ideal_partner_description
        )
      `)
      .eq("status", "active")
      .eq("onboarding_completed", true)
      .gte("last_active", cutoff.toISOString());

    if (usersError) {
      return { usersProcessed: 0, embeddingsGenerated: 0, pairsEvaluated: 0, pairsRecommended: 0, error: usersError.message };
    }

    const users: UserForEmbedding[] = (rawUsers ?? []).map((u) => ({
      user_id: u.user_id,
      display_name: u.display_name,
      date_of_birth: u.date_of_birth,
      gender: u.gender as Gender,
      show_me: u.show_me as ShowMe,
      bio: u.bio,
      work_study: u.work_study,
      interests: ((u.user_interests as { interest: string }[]) ?? []).map((i) => i.interest),
      prompts: (
        (u.user_prompts as { prompt_text: string; answer_text: string; position: number }[]) ?? []
      ).sort((a, b) => a.position - b.position),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ideal_partner_description: (u.user_embeddings as any)?.[0]?.ideal_partner_description ?? null,
    }));

    if (users.length < 2) {
      return { usersProcessed: users.length, embeddingsGenerated: 0, pairsEvaluated: 0, pairsRecommended: 0, error: null };
    }

    // ── Phase 2: Generate / refresh embeddings ──────────────────────────────
    // Load existing embedding rows to check which need regeneration
    const { data: existingEmbeddings } = await RecommendationsRepo.getAllUserEmbeddings(supabase);
    const embeddingMap = new Map<string, UserEmbeddingRow>(
      existingEmbeddings.map((e) => [e.user_id, e]),
    );

    type UserWithVectors = UserForEmbedding & {
      profileVec: number[];
      idealVec: number[];
    };

    const usersNeedingProfileEmbed: UserForEmbedding[] = [];
    const usersNeedingIdealEmbed: UserForEmbedding[] = [];

    for (const u of users) {
      const existing = embeddingMap.get(u.user_id);
      const profileText = buildProfileText(u);
      const idealText = buildIdealText(u); // null if no description written yet
      const profileHash = createHash("sha256").update(profileText).digest("hex").slice(0, 16);
      const idealHash = idealText
        ? createHash("sha256").update(idealText).digest("hex").slice(0, 16)
        : null;

      if (!existing?.profile_embedding || existing.profile_text_hash !== profileHash) {
        usersNeedingProfileEmbed.push(u);
      }
      // Only queue ideal regen when user HAS a description AND it changed
      if (idealText && (!existing?.ideal_embedding || existing.ideal_text_hash !== idealHash)) {
        usersNeedingIdealEmbed.push(u);
      }
    }

    // Generate new profile embeddings in batches
    if (usersNeedingProfileEmbed.length > 0) {
      const texts = usersNeedingProfileEmbed.map(buildProfileText);
      const vectors = await generateEmbeddingsBatched(texts);
      embeddingsGenerated += vectors.length;

      for (let i = 0; i < usersNeedingProfileEmbed.length; i++) {
        const u = usersNeedingProfileEmbed[i];
        const profileText = buildProfileText(u);
        const profileHash = createHash("sha256").update(profileText).digest("hex").slice(0, 16);
        await RecommendationsRepo.upsertUserEmbedding(supabase, {
          user_id: u.user_id,
          profile_embedding: vectors[i],
          profile_text_hash: profileHash,
        });
      }
    }

    // Generate new ideal embeddings in batches
    // Users without a description produce null from buildIdealText — skip them;
    // their ideal_text_hash / ideal_embedding stay null in the DB, which means
    // the algorithm will exclude them from pair calculation (see Phase 3 below).
    const usersNeedingIdealEmbedWithText = usersNeedingIdealEmbed
      .map((u) => ({ u, text: buildIdealText(u) }))
      .filter((x): x is { u: UserForEmbedding; text: string } => x.text !== null);

    if (usersNeedingIdealEmbedWithText.length > 0) {
      const texts = usersNeedingIdealEmbedWithText.map((x) => x.text);
      const vectors = await generateEmbeddingsBatched(texts);
      embeddingsGenerated += vectors.length;

      for (let i = 0; i < usersNeedingIdealEmbedWithText.length; i++) {
        const { u, text } = usersNeedingIdealEmbedWithText[i];
        const idealHash = createHash("sha256").update(text).digest("hex").slice(0, 16);
        await RecommendationsRepo.upsertUserEmbedding(supabase, {
          user_id: u.user_id,
          ideal_embedding: vectors[i],
          ideal_text_hash: idealHash,
        });
      }
    }

    // Reload embeddings after updates
    const { data: freshEmbeddings } = await RecommendationsRepo.getAllUserEmbeddings(supabase);
    const freshMap = new Map<string, UserEmbeddingRow>(
      freshEmbeddings.map((e) => [e.user_id, e]),
    );

    // Build final list of users with valid vectors.
    // A user is only eligible for recommendations if they have BOTH vectors.
    // Missing ideal_embedding means they haven't written their ideal partner
    // description yet — they are excluded from forming pairs (and therefore
    // neither receive recommendations nor appear in others').
    const usersWithVectors: UserWithVectors[] = [];
    for (const u of users) {
      const e = freshMap.get(u.user_id);
      if (e?.profile_embedding && e?.ideal_embedding) {
        usersWithVectors.push({
          ...u,
          profileVec: e.profile_embedding,
          idealVec: e.ideal_embedding,
        });
      }
    }

    // ── Phase 3: N²/2 cross-pair similarity ────────────────────────────────
    const { data: recentPairs } = await RecommendationsRepo.getRecentPairDates(supabase);

    // Also get existing matches to exclude
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .is("unmatched", false);

    const matchedPairs = new Set<string>();
    for (const m of existingMatches ?? []) {
      matchedPairs.add(`${m.user1_id}:${m.user2_id}`);
    }

    type ScoredPair = {
      user_a_id: string;
      user_b_id: string;
      score_a_to_b: number;
      score_b_to_a: number;
      compatibility_score: number;
    };

    const allPairs: ScoredPair[] = [];
    let pairsEvaluated = 0;

    const n = usersWithVectors.length;

    for (let i = 0; i < n; i++) {
      const A = usersWithVectors[i];
      for (let j = i + 1; j < n; j++) {
        const B = usersWithVectors[j];

        // Canonical ordering: user_a_id < user_b_id
        const [userA, userB] = A.user_id < B.user_id ? [A, B] : [B, A];

        pairsEvaluated++;

        // Hard filter: gender compatibility
        if (!isGenderCompatible(userA.gender, userA.show_me, userB.gender, userB.show_me)) {
          continue;
        }

        // Hard filter: 8-week cooldown
        const cooldownKey = `${userA.user_id}:${userB.user_id}`;
        if (recentPairs?.has(cooldownKey)) continue;

        // Hard filter: already matched
        if (matchedPairs.has(cooldownKey)) continue;

        // Compute directional cosine similarities
        // score_a_to_b: how well B's profile matches A's ideal
        const score_a_to_b = cosineSimilarity(userA.idealVec, userB.profileVec);
        // score_b_to_a: how well A's profile matches B's ideal
        const score_b_to_a = cosineSimilarity(userB.idealVec, userA.profileVec);

        // Both directions must meet the threshold (cross-recommendation guarantee)
        if (score_a_to_b < MATCH_THRESHOLD || score_b_to_a < MATCH_THRESHOLD) continue;

        const compatibility_score = (score_a_to_b + score_b_to_a) / 2;

        allPairs.push({
          user_a_id: userA.user_id,
          user_b_id: userB.user_id,
          score_a_to_b,
          score_b_to_a,
          compatibility_score,
        });
      }
    }

    // ── Phase 4: Take top-5 per user, archive old, insert new ───────────────

    // Group pairs by user, keep top 5 per user
    const userTopPairs = new Map<string, ScoredPair[]>();
    for (const pair of allPairs) {
      for (const uid of [pair.user_a_id, pair.user_b_id]) {
        const existing = userTopPairs.get(uid) ?? [];
        existing.push(pair);
        existing.sort((a, b) => b.compatibility_score - a.compatibility_score);
        userTopPairs.set(uid, existing.slice(0, TOP_N));
      }
    }

    // Deduplicate: only insert a pair if it's in top-5 for BOTH users
    const finalPairs = new Map<string, ScoredPair & { week_start: string }>();
    const weekStart = getWeekStart();

    for (const [uid, pairs] of userTopPairs) {
      for (const pair of pairs) {
        const otherId = pair.user_a_id === uid ? pair.user_b_id : pair.user_a_id;
        const otherPairs = userTopPairs.get(otherId) ?? [];
        const pairKey = `${pair.user_a_id}:${pair.user_b_id}`;

        // Only include if the other user also has this pair in their top-5
        const mutuallySelected = otherPairs.some(
          (p) => p.user_a_id === pair.user_a_id && p.user_b_id === pair.user_b_id,
        );

        // If not mutual, check if they have room (less than TOP_N already), be lenient
        const otherCount = otherPairs.filter(
          (p) => !(p.user_a_id === pair.user_a_id && p.user_b_id === pair.user_b_id),
        ).length;

        if ((mutuallySelected || otherCount < TOP_N) && !finalPairs.has(pairKey)) {
          finalPairs.set(pairKey, { ...pair, week_start: weekStart });
        }
      }
    }

    // Archive current active recommendations
    await RecommendationsRepo.markAllRecommendationsPast(supabase);

    // Insert new recommendations
    const pairsToInsert = Array.from(finalPairs.values());
    await RecommendationsRepo.insertRecommendationPairs(supabase, pairsToInsert);

    // Collect every user that received at least one recommendation
    const affectedUserIds = [
      ...new Set(pairsToInsert.flatMap((p) => [p.user_a_id, p.user_b_id])),
    ];

    return {
      usersProcessed: usersWithVectors.length,
      embeddingsGenerated,
      pairsEvaluated,
      pairsRecommended: pairsToInsert.length,
      affectedUserIds,
      error: null,
    };
  } catch (err) {
    return {
      usersProcessed: 0,
      embeddingsGenerated,
      pairsEvaluated: 0,
      pairsRecommended: 0,
      affectedUserIds: [] as string[],
      error: String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the ISO date string of this week's Monday */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // days to subtract to get Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}
