import { SupabaseClient } from "@supabase/supabase-js";
import type { SwipeType } from "@/lib/types";

/**
 * Create a swipe record (like, nope, superlike).
 * The database trigger `create_match_on_mutual_like` handles match creation.
 * The database trigger `update_stats_on_swipe` handles stats updates.
 */
export async function create(
  supabase: SupabaseClient,
  swiperId: string,
  swipedId: string,
  type: SwipeType,
) {
  return supabase
    .from("swipes")
    .insert({
      user_id: swiperId,
      target_id: swipedId,
      type,
    })
    .select()
    .single();
}

/**
 * Get recent swipes by a user, ordered by newest first.
 */
export async function getSwipesByUser(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50,
) {
  return supabase
    .from("swipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/**
 * Check if a user has already swiped on a target.
 */
export async function hasUserSwiped(
  supabase: SupabaseClient,
  swiperId: string,
  swipedId: string,
) {
  const { data, error } = await supabase
    .from("swipes")
    .select("id")
    .eq("user_id", swiperId)
    .eq("target_id", swipedId)
    .maybeSingle();

  if (error) return { data: false, error };

  return { data: data !== null, error: null };
}
