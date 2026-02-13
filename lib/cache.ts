import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import * as UsersRepository from "@/lib/repositories/users";
import * as MatchesRepository from "@/lib/repositories/matches";

/**
 * React.cache() wrappers for server-side per-request deduplication.
 * Multiple Server Components in the same render tree that call the same
 * function with the same args will only trigger one DB query.
 *
 * Usage: import { getProfile, getMatches } from "@/lib/cache";
 */

/** Cached user profile fetch — deduplicated per request. */
export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  return UsersRepository.getById(supabase, userId);
});

/** Cached match list fetch — deduplicated per request. */
export const getMatches = cache(async (userId: string) => {
  const supabase = await createClient();
  return MatchesRepository.getByUser(supabase, userId);
});

/** Cached user stats fetch — deduplicated per request. */
export const getUserStats = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
});
