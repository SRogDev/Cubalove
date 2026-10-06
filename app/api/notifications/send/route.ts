import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/services/notifications";
import { getNotificationPayload } from "@/lib/services/notifications";

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:cubalove@datingcuba.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface SendRequest {
  userId: string;
  type: NotificationType;
  data?: Record<string, string | number>;
}

export async function POST(request: NextRequest) {
  // Verify internal call via secret header
  const authHeader = request.headers.get("x-internal-secret");
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body: SendRequest = await request.json();
  const { userId, type, data } = body;

  if (!userId || !type) {
    return NextResponse.json(
      { error: "userId y type son requeridos" },
      { status: 400 }
    );
  }

  // Check frequency limit (max 1 per hour, except match)
  if (type !== "match") {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("notification_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("sent_at", oneHourAgo);

    if (count && count > 0) {
      return NextResponse.json(
        { skipped: true, reason: "Frecuencia limitada: máximo 1 por hora" },
        { status: 200 }
      );
    }
  }

  // Check if user has notifications enabled
  const { data: userSettings } = await supabaseAdmin
    .from("user_settings")
    .select("notifications_enabled")
    .eq("user_id", userId)
    .single();

  if (userSettings && !userSettings.notifications_enabled) {
    return NextResponse.json(
      { skipped: true, reason: "Notificaciones desactivadas por el usuario" },
      { status: 200 }
    );
  }

  // Get user's push subscriptions
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json(
      { skipped: true, reason: "Sin suscripciones push" },
      { status: 200 }
    );
  }

  const payload = getNotificationPayload(type, data);
  const payloadStr = JSON.stringify(payload);

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payloadStr
      );
      sent++;
    } catch (err) {
      failed.push(sub.endpoint);
      // Remove expired subscriptions (410 Gone)
      if (err instanceof webpush.WebPushError && err.statusCode === 410) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  // Log notification
  await supabaseAdmin.from("notification_log").insert({
    user_id: userId,
    type,
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({ sent, failed: failed.length });
}
