"use server";

import { stripe, STRIPE_PRICES } from "./config";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/types";

export async function createCheckoutSession(plan: SubscriptionPlan) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const priceId = STRIPE_PRICES[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Check if user already has a Stripe customer
  const { data: existingCustomer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = existingCustomer?.stripe_customer_id;

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    await supabase.from("stripe_customers").insert({
      user_id: user.id,
      stripe_customer_id: customerId,
    });
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/premium?success=true`,
    cancel_url: `${appUrl}/premium?canceled=true`,
    metadata: {
      user_id: user.id,
      plan,
    },
  });

  return { url: session.url };
}
