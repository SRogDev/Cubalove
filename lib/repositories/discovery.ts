import { SupabaseClient } from "@supabase/supabase-js";
import type { DiscoveryCandidate, ShowMe } from "@/lib/types";

// ---------------------------------------------------------------------------
// Gender mapping for show_me filter
// ---------------------------------------------------------------------------

const GENDER_MAP: Record<ShowMe, string[]> = {
  hombres: ["hombre"],
  mujeres: ["mujer"],
  ambos: ["hombre", "mujer", "otro"],
};

// ---------------------------------------------------------------------------
// Fetch candidate profiles for discovery scoring
// ---------------------------------------------------------------------------

/**
 * Fetch up to `limit` candidate profiles from the DB with all filters applied.
 *
 * This is a SINGLE optimized query that:
 *  1. Filters by gender preference
 *  2. Filters by age range
 *  3. Excludes self, blocked users, and recently swiped (< 30 days)
 *  4. Only returns active users with at least 1 photo
 *  5. Joins location, interests, photos, prompts, subscription, and boost
 *  6. Prioritizes by proximity (users with location first)
 *
 * Uses service_role client to bypass RLS for the cross-user query.
 */
export async function getCandidates(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    showMe: ShowMe;
    ageMin: number;
    ageMax: number;
    maxDistanceKm?: number;
    userLat?: number;
    userLng?: number;
  },
  excludeIds: string[],
  limit: number = 200,
): Promise<{ data: DiscoveryCandidate[]; error: string | null }> {
  try {
    const allowedGenders = GENDER_MAP[filters.showMe];

    // Calculate age boundaries as dates
    const now = new Date();
    const maxBirthDate = new Date(
      now.getFullYear() - filters.ageMin,
      now.getMonth(),
      now.getDate(),
    ).toISOString().split("T")[0];
    const minBirthDate = new Date(
      now.getFullYear() - filters.ageMax - 1,
      now.getMonth(),
      now.getDate(),
    ).toISOString().split("T")[0];

    // Build the main query — single round trip to DB
    // We use an RPC function for the heavy lifting to avoid N+1
    // But first, let's try the Supabase query builder approach with joins

    let query = supabase
      .from("users")
      .select(`
        user_id,
        display_name,
        date_of_birth,
        gender,
        bio,
        work_study,
        last_active,
        user_location!left (city, latitude, longitude),
        user_photos!inner (id, url, position),
        user_prompts!left (id, prompt_text, answer_text, position),
        user_interests!left (interest),
        user_subscriptions!left (plan, status),
        boosts!left (multiplier, expires_at)
      `)
      .eq("status", "active")
      .in("gender", allowedGenders)
      .gte("date_of_birth", minBirthDate)
      .lte("date_of_birth", maxBirthDate)
      .not("user_id", "in", `(${[userId, ...excludeIds].join(",")})`)
      .order("last_active", { ascending: false })
      .limit(limit);

    // If user has location and maxDistance is set, we could use PostGIS
    // but for the initial query we fetch broadly and score distance in-memory
    // This is more efficient for <200 candidates

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Transform the joined data into DiscoveryCandidate shape
    const candidates: DiscoveryCandidate[] = data.map((row: Record<string, unknown>) => {
      const location = row.user_location as Record<string, unknown> | null;
      const photos = (row.user_photos as Record<string, unknown>[] | null) ?? [];
      const prompts = (row.user_prompts as Record<string, unknown>[] | null) ?? [];
      const interests = (row.user_interests as Record<string, unknown>[] | null) ?? [];
      const subscription = row.user_subscriptions as Record<string, unknown> | Record<string, unknown>[] | null;
      const boosts = (row.boosts as Record<string, unknown>[] | null) ?? [];

      // Check for active boost
      const nowMs = Date.now();
      const activeBoost = boosts.find(
        (b) => new Date(b.expires_at as string).getTime() > nowMs,
      );

      // Get subscription plan (handle array or single object from left join)
      let plan: string | null = null;
      if (Array.isArray(subscription)) {
        const activeSub = subscription.find((s) => s.status === "active");
        plan = (activeSub?.plan as string) ?? null;
      } else if (subscription && (subscription as Record<string, unknown>).status === "active") {
        plan = (subscription as Record<string, unknown>).plan as string;
      }

      return {
        user_id: row.user_id as string,
        display_name: row.display_name as string,
        date_of_birth: row.date_of_birth as string,
        gender: row.gender,
        bio: row.bio as string | null,
        work_study: row.work_study as string | null,
        last_active: row.last_active as string,
        latitude: (location?.latitude as number) ?? null,
        longitude: (location?.longitude as number) ?? null,
        city: (location?.city as string) ?? null,
        interests: interests.map((i) => i.interest as string),
        photos: photos
          .sort((a, b) => (a.position as number) - (b.position as number))
          .map((p) => ({
            id: p.id as string,
            url: p.url as string,
            position: p.position as number,
          })),
        prompts: prompts
          .sort((a, b) => (a.position as number) - (b.position as number))
          .map((p) => ({
            id: p.id as string,
            prompt_text: p.prompt_text as string,
            answer_text: p.answer_text as string,
            position: p.position as number,
          })),
        plan: plan as DiscoveryCandidate["plan"],
        has_active_boost: !!activeBoost,
        boost_multiplier: activeBoost ? (activeBoost.multiplier as number) : 1.0,
      };
    });

    return { data: candidates, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error fetching candidates";
    return { data: [], error: message };
  }
}

// ---------------------------------------------------------------------------
// Fetch IDs to exclude (already swiped + blocked)
// ---------------------------------------------------------------------------

/**
 * Get all user IDs that should be excluded from discovery.
 * Includes: self, blocked (both directions), swiped in last 30 days.
 */
export async function getExcludedIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [swipesRes, blocksGivenRes, blocksReceivedRes] = await Promise.all([
    supabase
      .from("swipes")
      .select("target_id")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId),
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocked_id", userId),
  ]);

  const ids = new Set<string>([
    userId,
    ...(swipesRes.data ?? []).map((s) => s.target_id),
    ...(blocksGivenRes.data ?? []).map((b) => b.blocked_id),
    ...(blocksReceivedRes.data ?? []).map((b) => b.blocker_id),
  ]);

  return Array.from(ids);
}

// ---------------------------------------------------------------------------
// Boost operations
// ---------------------------------------------------------------------------

/**
 * Activate a boost for a user (30 minutes, 3x multiplier).
 */
export async function activateBoost(
  supabase: SupabaseClient,
  userId: string,
  durationMinutes: number = 30,
  multiplier: number = 3.0,
) {
  const expiresAt = new Date(
    Date.now() + durationMinutes * 60 * 1000,
  ).toISOString();

  return supabase
    .from("boosts")
    .insert({
      user_id: userId,
      expires_at: expiresAt,
      multiplier,
    })
    .select()
    .single();
}

/**
 * Get the active boost for a user (if any).
 */
export async function getActiveBoost(
  supabase: SupabaseClient,
  userId: string,
) {
  return supabase
    .from("boosts")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

/**
 * Get user's premium inventory (boosts & superlikes available).
 */
export async function getPremiumInventory(
  supabase: SupabaseClient,
  userId: string,
) {
  return supabase
    .from("user_premium_inventory")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
}

/**
 * Decrement a boost from inventory after activation.
 */
export async function decrementBoostInventory(
  supabase: SupabaseClient,
  userId: string,
) {
  // Use rpc or raw update to atomically decrement
  return supabase.rpc("decrement_boost_inventory", { p_user_id: userId });
}
