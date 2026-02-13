import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Save a push subscription for a user.
 * Uses upsert to avoid duplicates based on user_id + endpoint.
 */
export async function save(
  supabase: SupabaseClient,
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
) {
  return supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "user_id,endpoint" },
    )
    .select()
    .single();
}

/**
 * Get all push subscriptions for a user.
 */
export async function getByUser(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
}

/**
 * Remove a push subscription by user ID and endpoint.
 */
export async function remove(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
) {
  return supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
}

/**
 * Admin: get all push subscriptions (for broadcast notifications).
 */
export async function getAll(supabase: SupabaseClient) {
  return supabase
    .from("push_subscriptions")
    .select("*");
}
