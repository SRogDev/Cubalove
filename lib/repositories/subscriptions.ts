import { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlan } from "@/lib/types";

/**
 * Get a user's subscription.
 */
export async function getByUser(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
}

/**
 * Create or update a user subscription.
 * Uses upsert on user_id (which has a UNIQUE constraint).
 */
export async function upsert(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    plan: SubscriptionPlan;
    status: "active" | "inactive" | "canceled";
    payment_method?: "stripe" | "cup_manual";
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    current_period_start?: string | null;
    current_period_end?: string | null;
  },
) {
  return supabase
    .from("user_subscriptions")
    .upsert(data, { onConflict: "user_id" })
    .select()
    .single();
}

/**
 * Get CUP prices for all plans.
 */
export async function getCupPrices(supabase: SupabaseClient) {
  return supabase
    .from("cup_prices")
    .select("id, plan, price_cup, updated_at")
    .order("plan", { ascending: true });
}

/**
 * Admin: update a CUP price for a plan.
 */
export async function updateCupPrices(
  supabase: SupabaseClient,
  plan: SubscriptionPlan,
  price: number,
  updatedBy: string,
) {
  return supabase
    .from("cup_prices")
    .update({
      price_cup: price,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("plan", plan)
    .select()
    .single();
}
