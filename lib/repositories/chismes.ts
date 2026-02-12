import { SupabaseClient } from "@supabase/supabase-js";
import type { Chisme } from "@/lib/types";

/**
 * Get active chismes, newest first, with pagination.
 */
export async function getAll(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0,
) {
  return supabase
    .from("chismes")
    .select("id, content, image_url, views, likes, clicks, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}

/**
 * Admin: create a new chisme.
 */
export async function create(
  supabase: SupabaseClient,
  content: Chisme["content"],
  imageUrl?: string,
  createdBy?: string,
) {
  return supabase
    .from("chismes")
    .insert({
      content,
      image_url: imageUrl ?? null,
      created_by: createdBy,
    })
    .select()
    .single();
}

/**
 * Toggle like on a chisme. If the user already liked it, remove the like.
 * If not, add the like.
 */
export async function toggleLike(
  supabase: SupabaseClient,
  chismeId: string,
  userId: string,
) {
  // Check if the user already liked this chisme
  const { data: existing, error: checkError } = await supabase
    .from("chisme_interactions")
    .select("id")
    .eq("chisme_id", chismeId)
    .eq("user_id", userId)
    .eq("action", "like")
    .maybeSingle();

  if (checkError) return { data: null, error: checkError };

  if (existing) {
    // Unlike: remove the interaction
    const { error: deleteError } = await supabase
      .from("chisme_interactions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) return { data: null, error: deleteError };

    return { data: { liked: false }, error: null };
  } else {
    // Like: insert the interaction
    const { error: insertError } = await supabase
      .from("chisme_interactions")
      .insert({
        chisme_id: chismeId,
        user_id: userId,
        action: "like",
      });

    if (insertError) return { data: null, error: insertError };

    return { data: { liked: true }, error: null };
  }
}

/**
 * Track a user interaction with a chisme (view, click, share).
 * Uses upsert to avoid duplicate tracking per action type (UNIQUE constraint).
 */
export async function trackInteraction(
  supabase: SupabaseClient,
  chismeId: string,
  userId: string,
  type: "view" | "click" | "share",
) {
  return supabase
    .from("chisme_interactions")
    .upsert(
      {
        chisme_id: chismeId,
        user_id: userId,
        action: type,
      },
      { onConflict: "chisme_id,user_id,action" },
    );
}
