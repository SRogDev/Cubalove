import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";

// Use service role for webhook processing (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getCustomerId(
  customer: string | { id: string } | null
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook error: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan as "plus" | "vip" | undefined;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (userId && plan && subscriptionId) {
        // Get subscription details from Stripe
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const item = subscription.items.data[0];
        const customerId = getCustomerId(subscription.customer);
        const periodStart = item
          ? new Date(item.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = item
          ? new Date(item.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString();

        // Upsert business subscription
        await supabaseAdmin.from("user_subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            payment_method: "stripe",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: periodStart,
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" }
        );

        // Track in stripe_subscriptions
        await supabaseAdmin.from("stripe_subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            stripe_price_id: item?.price.id,
            status: subscription.status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
          },
          { onConflict: "stripe_subscription_id" }
        );

        // Record payment
        if (session.payment_intent) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id;

          await supabaseAdmin.from("stripe_payments").insert({
            user_id: userId,
            stripe_payment_intent_id: paymentIntentId,
            amount: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            status: "succeeded",
            description: `Suscripción ${plan.toUpperCase()}`,
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const stripeSubId = subscription.id;
      const item = subscription.items.data[0];

      const updateData: Record<string, unknown> = {
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      };

      if (item) {
        updateData.current_period_start = new Date(
          item.current_period_start * 1000
        ).toISOString();
        updateData.current_period_end = new Date(
          item.current_period_end * 1000
        ).toISOString();
      }

      await supabaseAdmin
        .from("stripe_subscriptions")
        .update(updateData)
        .eq("stripe_subscription_id", stripeSubId);

      // Also update business subscription status
      if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid"
      ) {
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", stripeSubId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;

      await supabaseAdmin
        .from("stripe_subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);

      await supabaseAdmin
        .from("user_subscriptions")
        .update({ status: "inactive" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = getCustomerId(invoice.customer);

      if (customerId) {
        const { data: customer } = await supabaseAdmin
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (customer) {
          await supabaseAdmin.from("stripe_payments").insert({
            user_id: customer.user_id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due ?? 0,
            currency: invoice.currency ?? "usd",
            status: "failed",
            description: "Pago fallido",
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
