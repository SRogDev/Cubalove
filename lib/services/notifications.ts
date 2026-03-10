import { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Initialize VAPID keys once at module load (idempotent)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@cubalove.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "match"
  | "re_engagement"
  | "new_chisme"
  | "boost_ended"
  | "superlike_received"
  | "new_recommendations";

export interface NotificationPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  url: string;
  tag: string;
}

export interface NotificationData {
  name?: string;
  viewCount?: number;
}

// ---------------------------------------------------------------------------
// Notification Templates
// ---------------------------------------------------------------------------

const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  {
    title: string | ((data?: NotificationData) => string);
    body: string | ((data?: NotificationData) => string);
    url: string;
    tag: string;
  }
> = {
  match: {
    title: "\uD83D\uDC98 \u00A1Empataste!",
    body: (data) =>
      `T\u00FA y ${data?.name ?? "alguien"} se gustan. Abre la app y manda el primer mensaje`,
    url: "/matches",
    tag: "match",
  },
  re_engagement: {
    title: "\uD83D\uDC40 Asere, \u00BFd\u00F3nde te metiste?",
    body: "Hace un tiempo que no buscas pareja. Hay gente nueva esper\u00E1ndote",
    url: "/discover",
    tag: "re_engagement",
  },
  new_chisme: {
    title: "\uD83D\uDD25 \u00A1Nuevo chisme!",
    body: "Hay un nuevo chisme que no te puedes perder. Entra a verlo",
    url: "/chismes",
    tag: "new_chisme",
  },
  boost_ended: {
    title: "\uD83D\uDE80 Tu Boost termin\u00F3",
    body: (data) =>
      `Fuiste visto por ${data?.viewCount ?? 0} personas. \u00A1Tremendo alcance!`,
    url: "/discover",
    tag: "boost_ended",
  },
  superlike_received: {
    title: "\u2B50 \u00A1Alguien te dio Superlike!",
    body: "Entra a ver qui\u00E9n es",
    url: "/discover",
    tag: "superlike_received",
  },
  new_recommendations: {
    title: "\u2728 Tus recomendados de la semana",
    body: "Tenemos personas que podr\u00EDan gustarte. Entra a verlas en Recomendado",
    url: "/discover",
    tag: "new_recommendations",
  },
};

// ---------------------------------------------------------------------------
// Get Notification Payload
// ---------------------------------------------------------------------------

/**
 * Build the notification payload for a given type.
 * Template strings are resolved using the optional data parameter.
 */
export function getNotificationPayload(
  type: NotificationType,
  data?: NotificationData,
): NotificationPayload {
  const template = NOTIFICATION_TEMPLATES[type];

  const title =
    typeof template.title === "function" ? template.title(data) : template.title;
  const body =
    typeof template.body === "function" ? template.body(data) : template.body;

  return {
    title,
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    url: template.url,
    tag: template.tag,
  };
}

// ---------------------------------------------------------------------------
// Send Push Notification
// ---------------------------------------------------------------------------

/**
 * Send a push notification to a single subscription endpoint via web-push.
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: NotificationPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar notificaci\u00F3n";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Send to User
// ---------------------------------------------------------------------------

/**
 * Send a notification to all push subscriptions registered for a user.
 *
 * Expects a `push_subscriptions` table with columns:
 *   - user_id (uuid)
 *   - endpoint (text)
 *   - p256dh (text)
 *   - auth (text)
 *
 * Also logs the notification in a `notification_log` table for frequency
 * limiting (see `canSendNotification`).
 */
export async function sendToUser(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  data?: NotificationData,
): Promise<{ sent: number; errors: string[] }> {
  // 1. Check if we're allowed to send this notification type
  const allowed = await canSendNotification(supabase, userId, type);
  if (!allowed) {
    return { sent: 0, errors: ["L\u00EDmite de frecuencia alcanzado para este tipo de notificaci\u00F3n"] };
  }

  // 2. Fetch user's push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (subError || !subscriptions || subscriptions.length === 0) {
    return {
      sent: 0,
      errors: subError
        ? [subError.message]
        : ["El usuario no tiene suscripciones push registradas"],
    };
  }

  // 3. Build payload
  const payload = getNotificationPayload(type, data);

  // 4. Send to all subscriptions
  const errors: string[] = [];
  let sent = 0;

  for (const sub of subscriptions) {
    const pushSub: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const result = await sendPushNotification(pushSub, payload);
    if (result.success) {
      sent++;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  // 5. Log the notification for frequency limiting
  await supabase.from("notification_log").insert({
    user_id: userId,
    type,
    sent_at: new Date().toISOString(),
  });

  return { sent, errors };
}

// ---------------------------------------------------------------------------
// Frequency Limiting
// ---------------------------------------------------------------------------

/**
 * Check whether a notification of a given type can be sent to a user.
 *
 * Rules:
 *  - `match` notifications have no frequency limit (always allowed)
 *  - All other types are limited to max 1 per hour per type
 *
 * Uses a `notification_log` table with columns:
 *   - user_id (uuid)
 *   - type (text)
 *   - sent_at (timestamptz)
 */
export async function canSendNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  // Match notifications are always allowed
  if (type === "match") {
    return true;
  }

  // Check last notification of this type within the past hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("notification_log")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("sent_at", oneHourAgo)
    .limit(1);

  if (error) {
    // If we can't check, allow the notification (fail open)
    return true;
  }

  return !data || data.length === 0;
}
