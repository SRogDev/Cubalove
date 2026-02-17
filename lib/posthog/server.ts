import { PostHog } from "posthog-node";

// ---------------------------------------------------------------------------
// PostHog Server Client — for API routes and server actions
// ---------------------------------------------------------------------------

let client: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      // Return a no-op client if key not configured
      return {
        capture: () => {},
        identify: () => {},
        shutdown: async () => {},
      } as unknown as PostHog;
    }

    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}
