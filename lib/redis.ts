import { RedisClient } from "bun";

// ---------------------------------------------------------------------------
// Bun native Redis client — reads REDIS_URL from env automatically
// Lazy connection: no connection until first command
// ---------------------------------------------------------------------------

const redis = new RedisClient(process.env.REDIS_URL ?? "redis://localhost:6379");

export default redis;

// ---------------------------------------------------------------------------
// Cache key builders — centralized to avoid typos
// ---------------------------------------------------------------------------

export const CacheKeys = {
  /** Discovery queue for a user (sorted profiles ready to show) */
  discoveryQueue: (userId: string) => `discovery:queue:${userId}`,

  /** Set of profile IDs already shown to user (30-day cooldown) */
  shownProfiles: (userId: string) => `discovery:shown:${userId}`,

  /** User's active boost data */
  activeBoost: (userId: string) => `boost:active:${userId}`,

  /** User interests set (for fast intersection) */
  userInterests: (userId: string) => `user:interests:${userId}`,

  /** User location hash */
  userLocation: (userId: string) => `user:location:${userId}`,

  /** User subscription plan */
  userPlan: (userId: string) => `user:plan:${userId}`,

  /** User last active timestamp */
  userLastActive: (userId: string) => `user:lastactive:${userId}`,

  /** Active recommendations for a user (cached for the week) */
  recommendations: (userId: string) => `recs:active:${userId}`,
} as const;

// ---------------------------------------------------------------------------
// TTL constants (seconds)
// ---------------------------------------------------------------------------

export const CacheTTL = {
  DISCOVERY_QUEUE: 60 * 30,        // 30 min — queue expires if user is idle
  SHOWN_PROFILES: 60 * 60 * 24 * 30, // 30 days — cooldown before re-showing
  ACTIVE_BOOST: 60 * 30,           // 30 min — max boost duration
  USER_INTERESTS: 60 * 60 * 6,     // 6 hours
  USER_LOCATION: 60 * 60 * 1,      // 1 hour
  USER_PLAN: 60 * 60 * 1,          // 1 hour
  USER_LAST_ACTIVE: 60 * 60 * 1,   // 1 hour
  RECOMMENDATIONS: 60 * 60 * 24 * 7, // 7 days — valid for the whole week
} as const;
