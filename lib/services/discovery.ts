import { SupabaseClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import type { UserProfile, SwipeType, ShowMe } from "@/lib/types";
import { getCandidates, getExcludedIds } from "@/lib/repositories/discovery";
import { scoreAndRankCandidates, candidateToProfile } from "@/lib/services/matching";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveryFilters {
  showMe: ShowMe;
  ageMin: number;
  ageMax: number;
  maxDistanceKm?: number;
}

export interface SwipeResult {
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Discovery Queue (real implementation)
// ---------------------------------------------------------------------------

/**
 * Get profiles for the swipe queue with full scoring algorithm.
 *
 * Business rules:
 *  1. Exclude self, blocked users, swiped in last 30 days
 *  2. Filter by gender preference, age range
 *  3. Score by distance (40%), interests (30%), activity (20%), random (10%)
 *  4. Apply plan and boost multipliers
 *  5. Return top profiles sorted by score
 */
export async function getDiscoveryQueue(
  supabase: SupabaseClient,
  userId: string,
  filters: DiscoveryFilters,
  userLat?: number | null,
  userLng?: number | null,
  limit: number = 20,
): Promise<{ data: UserProfile[]; error: string | null }> {
  try {
    // Fetch IDs to exclude
    const excludedIds = await getExcludedIds(supabase, userId);

    // Fetch candidates from DB
    const { data: candidates, error } = await getCandidates(
      supabase,
      userId,
      {
        showMe: filters.showMe,
        ageMin: filters.ageMin,
        ageMax: filters.ageMax,
        maxDistanceKm: filters.maxDistanceKm,
        userLat: userLat ?? undefined,
        userLng: userLng ?? undefined,
      },
      excludedIds,
      200,
    );

    if (error) return { data: [], error };

    // Fetch user's interests for scoring
    const { data: interestsData } = await supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", userId);
    const userInterests = (interestsData ?? []).map((i) => i.interest);

    // Score and rank
    const scored = scoreAndRankCandidates(
      candidates,
      userLat ?? null,
      userLng ?? null,
      userInterests,
    );

    // Apply max distance filter if set
    let filtered = scored;
    if (filters.maxDistanceKm) {
      filtered = scored.filter(
        (c) => c.distance_km === null || c.distance_km <= filters.maxDistanceKm!,
      );
    }

    // Take top N and convert to UserProfile
    const profiles = filtered.slice(0, limit).map(candidateToProfile);

    return { data: profiles, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener perfiles";
    return { data: [], error: message };
  }
}

// ---------------------------------------------------------------------------
// Perform Swipe
// ---------------------------------------------------------------------------

/**
 * Record a swipe and check for a mutual match.
 *
 * The database trigger `create_match_on_mutual_like` handles match creation
 * automatically, but we still query afterwards to return the match info to
 * the client for the "It's a Match!" screen.
 */
export async function performSwipe(
  supabase: SupabaseClient,
  userId: string,
  targetId: string,
  type: SwipeType,
): Promise<SwipeResult> {
  // 1. Insert the swipe record
  const { error: swipeError } = await supabase
    .from("swipes")
    .insert({
      user_id: userId,
      target_id: targetId,
      type,
    });

  if (swipeError) {
    // Duplicate swipe (already swiped on this person)
    if (swipeError.code === "23505") {
      return { success: false, isMatch: false, error: "Ya hiciste swipe en este perfil" };
    }
    return { success: false, isMatch: false, error: swipeError.message };
  }

  // 2. If it was a nope, no match possible
  if (type === "nope") {
    return { success: true, isMatch: false };
  }

  // 3. Check if a match was created by the database trigger
  //    The trigger uses LEAST/GREATEST so user1_id < user2_id
  const user1 = userId < targetId ? userId : targetId;
  const user2 = userId < targetId ? targetId : userId;

  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("user1_id", user1)
    .eq("user2_id", user2)
    .eq("unmatched", false)
    .maybeSingle();

  if (match) {
    return { success: true, isMatch: true, matchId: match.id };
  }

  return { success: true, isMatch: false };
}

// ---------------------------------------------------------------------------
// Distance Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the distance in kilometers between two geographic points.
 * Uses the geolib library for accurate geodesic calculation.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const meters = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 },
  );
  return meters / 1000;
}
