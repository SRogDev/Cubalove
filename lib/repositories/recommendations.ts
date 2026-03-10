import { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendedProfile, UserProfile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Recommendation Repository
// All functions accept a service_role Supabase client (bypasses RLS)
// ---------------------------------------------------------------------------

/** Full profile data for a recommended user (joined from multiple tables) */
interface RecommendationRow {
    id: string;
    user_a_id: string;
    user_b_id: string;
    score_a_to_b: number;
    score_b_to_a: number;
    compatibility_score: number;
    week_start: string;
    // joined user data (dynamically mapped below)
    profile?: UserProfile;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns up to 5 active recommendations for a user, with full profile data.
 * Queries both sides of the pair (user can be user_a OR user_b).
 */
export async function getActiveRecommendations(
    supabase: SupabaseClient,
    userId: string,
): Promise<{ data: RecommendedProfile[]; error: string | null }> {
    try {
        // We fetch both directions: rows where user is user_a, and where user is user_b
        const [asA, asB] = await Promise.all([
            supabase
                .from("recommendations")
                .select(`
          id, user_a_id, user_b_id, score_a_to_b, score_b_to_a, compatibility_score, week_start,
          other_user:users!recommendations_user_b_id_fkey (
            user_id, display_name, date_of_birth, gender, show_me, bio, work_study, last_active,
            onboarding_completed, role, status,
            user_photos (id, url, position),
            user_prompts (id, prompt_text, answer_text, position),
            user_interests (interest),
            user_location (city, latitude, longitude)
          )
        `)
                .eq("user_a_id", userId)
                .eq("status", "active")
                .order("compatibility_score", { ascending: false })
                .limit(5),

            supabase
                .from("recommendations")
                .select(`
          id, user_a_id, user_b_id, score_a_to_b, score_b_to_a, compatibility_score, week_start,
          other_user:users!recommendations_user_a_id_fkey (
            user_id, display_name, date_of_birth, gender, show_me, bio, work_study, last_active,
            onboarding_completed, role, status,
            user_photos (id, url, position),
            user_prompts (id, prompt_text, answer_text, position),
            user_interests (interest),
            user_location (city, latitude, longitude)
          )
        `)
                .eq("user_b_id", userId)
                .eq("status", "active")
                .order("compatibility_score", { ascending: false })
                .limit(5),
        ]);

        if (asA.error) return { data: [], error: asA.error.message };
        if (asB.error) return { data: [], error: asB.error.message };

        const combined: RecommendedProfile[] = [];

        // Process rows where viewer is user_a (score_a_to_b is viewer → other)
        for (const row of asA.data ?? []) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = (row as any).other_user;
            if (!u) continue;
            combined.push(buildRecommendedProfile(u, {
                score_toward_me: row.score_b_to_a,   // how much OTHER wants ME
                score_toward_them: row.score_a_to_b,  // how much I want OTHER
                compatibility_score: row.compatibility_score,
            }));
        }

        // Process rows where viewer is user_b (score_b_to_a is viewer → other)
        for (const row of asB.data ?? []) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const u = (row as any).other_user;
            if (!u) continue;
            combined.push(buildRecommendedProfile(u, {
                score_toward_me: row.score_a_to_b,   // how much OTHER wants ME (a→b when viewer is b)
                score_toward_them: row.score_b_to_a,  // how much I want OTHER
                compatibility_score: row.compatibility_score,
            }));
        }

        // Sort by total score and take top 5 across both query results
        combined.sort((a, b) => b.compatibility_score - a.compatibility_score);

        return { data: combined.slice(0, 5), error: null };
    } catch (err) {
        return { data: [], error: String(err) };
    }
}

// ---------------------------------------------------------------------------
// Batch write (used by the calculation service)
// ---------------------------------------------------------------------------

export interface RecommendationPair {
    user_a_id: string;
    user_b_id: string;
    score_a_to_b: number;
    score_b_to_a: number;
    compatibility_score: number;
    week_start: string;
}

/** Insert new recommendation pairs in bulk (called after weekly calculation) */
export async function insertRecommendationPairs(
    supabase: SupabaseClient,
    pairs: RecommendationPair[],
): Promise<{ error: string | null }> {
    if (pairs.length === 0) return { error: null };

    const { error } = await supabase
        .from("recommendations")
        .insert(pairs.map((p) => ({ ...p, status: "active" })));

    return { error: error?.message ?? null };
}

/** Mark all currently active recommendations as 'past' before recalculation */
export async function markAllRecommendationsPast(
    supabase: SupabaseClient,
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from("recommendations")
        .update({ status: "past" })
        .eq("status", "active");

    return { error: error?.message ?? null };
}

/**
 * Returns the most recent recommendation date for each pair.
 * Used to enforce the 8-week cooldown: pairs that appear here within
 * the last 8 weeks are excluded from the new batch.
 */
export async function getRecentPairDates(
    supabase: SupabaseClient,
): Promise<{ data: Map<string, Date>; error: string | null }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 8 * 7); // 8 weeks ago

    const { data, error } = await supabase
        .from("recommendations")
        .select("user_a_id, user_b_id, created_at")
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false });

    if (error) return { data: new Map(), error: error.message };

    // Build a map: "uuid_a:uuid_b" → most recent date
    const map = new Map<string, Date>();
    for (const row of data ?? []) {
        const key = `${row.user_a_id}:${row.user_b_id}`;
        if (!map.has(key)) {
            map.set(key, new Date(row.created_at));
        }
    }

    return { data: map, error: null };
}

// ---------------------------------------------------------------------------
// Embeddings (used by calculation service)
// ---------------------------------------------------------------------------

export interface UserEmbeddingRow {
    user_id: string;
    profile_embedding: number[] | null;
    ideal_embedding: number[] | null;
    profile_text_hash: string | null;
    ideal_text_hash: string | null;
}

/** Fetch all users with their current embeddings (for batch calculation) */
export async function getAllUserEmbeddings(
    supabase: SupabaseClient,
): Promise<{ data: UserEmbeddingRow[]; error: string | null }> {
    const { data, error } = await supabase
        .from("user_embeddings")
        .select("user_id, profile_embedding, ideal_embedding, profile_text_hash, ideal_text_hash");

    return { data: data ?? [], error: error?.message ?? null };
}

/** Upsert embeddings for a user (insert or update) */
export async function upsertUserEmbedding(
    supabase: SupabaseClient,
    row: {
        user_id: string;
        profile_embedding?: number[];
        ideal_embedding?: number[];
        profile_text_hash?: string | null;
        ideal_text_hash?: string | null;
        ideal_partner_description?: string;
    },
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from("user_embeddings")
        .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    return { error: error?.message ?? null };
}

/** Fetch ideal_partner_description for a single user */
export async function getIdealPartnerDescription(
    supabase: SupabaseClient,
    userId: string,
): Promise<{ data: string | null; error: string | null }> {
    const { data, error } = await supabase
        .from("user_embeddings")
        .select("ideal_partner_description")
        .eq("user_id", userId)
        .maybeSingle();

    return {
        data: data?.ideal_partner_description ?? null,
        error: error?.message ?? null,
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRecommendedProfile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any,
    scores: {
        score_toward_me: number;
        score_toward_them: number;
        compatibility_score: number;
    },
): RecommendedProfile {
    const photos = (raw.user_photos ?? [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    const prompts = (raw.user_prompts ?? [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    const interests = (raw.user_interests ?? []).map((i: { interest: string }) => i.interest);
    const loc = raw.user_location;

    const profile: UserProfile = {
        user_id: raw.user_id,
        display_name: raw.display_name,
        date_of_birth: raw.date_of_birth,
        gender: raw.gender,
        show_me: raw.show_me,
        bio: raw.bio ?? null,
        work_study: raw.work_study ?? null,
        role: raw.role,
        status: raw.status,
        onboarding_completed: raw.onboarding_completed,
        last_active: raw.last_active,
        photos,
        prompts,
        interests,
        location: loc
            ? { city: loc.city, latitude: loc.latitude, longitude: loc.longitude }
            : null,
    };

    return { ...profile, ...scores };
}
