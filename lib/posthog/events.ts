// ---------------------------------------------------------------------------
// PostHog Event Constants — All analytics events in one place
// ---------------------------------------------------------------------------

export const EVENTS = {
  // ===== Core Actions =====
  MATCH: "match",
  SWIPE_LIKE: "swipe_like",
  SWIPE_NOPE: "swipe_nope",
  SWIPE_SUPERLIKE: "swipe_superlike",

  // ===== Onboarding =====
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_ABANDONED: "onboarding_abandoned",

  // ===== Couple Mode =====
  COUPLE_MODE_ACTIVATED: "couple_mode_activated",
  COUPLE_REQUEST_SENT: "couple_request_sent",
  COUPLE_REQUEST_ACCEPTED: "couple_request_accepted",
  COUPLE_DIARY_ENTRY: "couple_diary_entry",
  COUPLE_VAULT_UPDATED: "couple_vault_updated",
  COUPLE_CHALLENGE_VIEWED: "couple_challenge_viewed",

  // ===== Engagement Limits =====
  LIKES_EXHAUSTED: "likes_exhausted",
  SUPERLIKES_EXHAUSTED: "superlikes_exhausted",

  // ===== Purchases =====
  PURCHASE_SUBSCRIPTION_PLUS: "purchase_subscription_plus",
  PURCHASE_SUBSCRIPTION_VIP: "purchase_subscription_vip",
  PURCHASE_BOOST: "purchase_boost",
  PURCHASE_SUPERLIKE_PACK: "purchase_superlike_pack",
  PURCHASE_CREDITS_PACK_1: "purchase_credits_pack_1",
  PURCHASE_CREDITS_PACK_2: "purchase_credits_pack_2",
  PURCHASE_CREDITS_PACK_3: "purchase_credits_pack_3",

  // ===== Retention Events =====
  SESSION_START: "session_start",
  SESSION_DURATION: "session_duration",
  DAY_1_RETURN: "day_1_return",
  DAY_7_RETURN: "day_7_return",
  DAY_30_RETURN: "day_30_return",
  PROFILE_COMPLETED: "profile_completed",
  FIRST_MESSAGE_SENT: "first_message_sent",
  FIRST_MATCH: "first_match",
  PUSH_NOTIFICATION_ENABLED: "push_notification_enabled",
  APP_INSTALLED_PWA: "app_installed_pwa",

  // ===== Conversion Events =====
  PREMIUM_PAGE_VIEWED: "premium_page_viewed",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_COMPLETED: "checkout_completed",
  CHECKOUT_ABANDONED: "checkout_abandoned",
  UPGRADE_PROMPT_SHOWN: "upgrade_prompt_shown",
  UPGRADE_PROMPT_CLICKED: "upgrade_prompt_clicked",
  TRIAL_STARTED: "trial_started",
  SUBSCRIPTION_CANCELED: "subscription_canceled",

  // ===== Feature Usage =====
  BOOST_ACTIVATED: "boost_activated",
  REWIND_USED: "rewind_used",
  PROFILE_VIEWED: "profile_viewed",
  CHAT_OPENED: "chat_opened",
  MESSAGE_SENT: "message_sent",
  PHOTO_UPLOADED: "photo_uploaded",
  CHISME_VIEWED: "chisme_viewed",
  CHISME_LIKED: "chisme_liked",
  CHISME_SHARED: "chisme_shared",
  DISCOVERY_QUEUE_EMPTY: "discovery_queue_empty",
  LOCATION_SHARED: "location_shared",

  // ===== Share & Virality =====
  SHARE_WHATSAPP: "share_whatsapp",
  SHARE_INSTAGRAM: "share_instagram",
  INVITE_SENT: "invite_sent",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
