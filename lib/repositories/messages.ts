import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get messages for a match, ordered by newest first with pagination.
 */
export async function getByMatch(
  supabase: SupabaseClient,
  matchId: string,
  limit: number = 50,
  offset: number = 0,
) {
  return supabase
    .from("messages")
    .select("id, match_id, sender_id, content, read, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}

/**
 * Send a message in a match.
 * The database trigger `set_match_last_message` updates last_message_at on the match.
 */
export async function send(
  supabase: SupabaseClient,
  matchId: string,
  senderId: string,
  content: string,
) {
  return supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();
}

/**
 * Mark all unread messages in a match as read for a given user.
 * Only marks messages NOT sent by the user (i.e., messages received by the user).
 */
export async function markAsRead(
  supabase: SupabaseClient,
  matchId: string,
  userId: string,
) {
  return supabase
    .from("messages")
    .update({ read: true })
    .eq("match_id", matchId)
    .neq("sender_id", userId)
    .eq("read", false);
}
