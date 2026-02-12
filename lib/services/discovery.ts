import { SupabaseClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import type { UserProfile, SwipeType, ShowMe } from "@/lib/types";
import { MOCK_PROFILES } from "@/lib/mock-data";

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
// Discovery Queue
// ---------------------------------------------------------------------------

/**
 * Get profiles for the swipe queue.
 *
 * Business rules:
 *  1. Exclude the current user
 *  2. Exclude already-swiped profiles
 *  3. Filter by gender preference (showMe)
 *  4. Filter by age range
 *  5. Optionally filter by max distance
 *  6. Exclude blocked users (both directions)
 *  7. Only return active users
 *
 * TODO: Replace mock implementation with real Supabase queries once
 *       the discovery repository is built.
 */
export async function getDiscoveryQueue(
  supabase: SupabaseClient,
  userId: string,
  filters: DiscoveryFilters,
): Promise<{ data: UserProfile[]; error: string | null }> {
  try {
    // --- Fetch IDs to exclude (already swiped + blocked) ---
    const [swipesRes, blocksGivenRes, blocksReceivedRes] = await Promise.all([
      supabase
        .from("swipes")
        .select("target_id")
        .eq("user_id", userId),
      supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", userId),
      supabase
        .from("blocks")
        .select("blocker_id")
        .eq("blocked_id", userId),
    ]);

    const excludedIds = new Set<string>([
      userId,
      ...(swipesRes.data ?? []).map((s) => s.target_id),
      ...(blocksGivenRes.data ?? []).map((b) => b.blocked_id),
      ...(blocksReceivedRes.data ?? []).map((b) => b.blocker_id),
    ]);

    // --- Mock: filter MOCK_PROFILES applying business rules ---
    const genderMap: Record<ShowMe, string[]> = {
      hombres: ["hombre"],
      mujeres: ["mujer"],
      ambos: ["hombre", "mujer", "otro"],
    };

    const allowedGenders = genderMap[filters.showMe];

    const now = new Date();
    const filtered = MOCK_PROFILES.filter((profile) => {
      if (excludedIds.has(profile.user_id)) return false;
      if (profile.status !== "active") return false;
      if (!allowedGenders.includes(profile.gender)) return false;

      // Age filter
      const birth = new Date(profile.date_of_birth);
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      if (age < filters.ageMin || age > filters.ageMax) return false;

      return true;
    });

    return { data: filtered, error: null };
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
