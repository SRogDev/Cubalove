"use client";

import posthog from "posthog-js";

// ---------------------------------------------------------------------------
// PostHog Client — Singleton initialization
// ---------------------------------------------------------------------------

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) return;

  posthog.init(key, {
    api_host: host || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
    autocapture: false,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });

  initialized = true;
}

export { posthog };
