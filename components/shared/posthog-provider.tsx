"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog/client";

/**
 * PostHog provider component — initializes PostHog and tracks pageviews.
 * Added to root layout. No React context needed.
 */
export function PostHogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog();
  }, []);

  // Track pageviews on route change
  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    if (searchParams?.toString()) {
      url += `?${searchParams.toString()}`;
    }
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Identify user in PostHog after auth.
 * Call this component once the user is authenticated.
 */
export function PostHogIdentify({
  userId,
  properties,
}: {
  userId: string;
  properties?: Record<string, unknown>;
}) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, properties);
    }
  }, [userId, properties]);

  return null;
}
