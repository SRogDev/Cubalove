import redis, { CacheKeys, CacheTTL } from "@/lib/redis";
import { createServiceClient } from "@/lib/supabase/server";
import { getCandidates, getExcludedIds } from "@/lib/repositories/discovery";
import { scoreAndRankCandidates, candidateToProfile } from "@/lib/services/matching";

// ---------------------------------------------------------------------------
// Pre-compute Discovery Queues (Medida 4)
//
// Runs every 15 minutes via cron (or Bun.setInterval in dev).
// Pre-builds scored queues for recently active users and caches in Redis.
//
// This eliminates DB queries during GET /api/discovery for cached users,
// reducing response time from ~100ms to ~5ms.
// ---------------------------------------------------------------------------

const PRECOMPUTE_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVE_THRESHOLD_HOURS = 2; // Only precompute for users active in last 2h
const BATCH_SIZE = 50; // Process users in batches
const CANDIDATES_LIMIT = 200;
const QUEUE_SIZE = 100; // Store top 100 profiles per user

interface PrecomputeStats {
  total_users: number;
  processed: number;
  cached: number;
  errors: number;
  duration_ms: number;
}

/**
 * Precompute discovery queues for recently active users.
 *
 * Flow:
 *  1. Fetch users active in last 2 hours
 *  2. For each user (batched):
 *     a. Get their filters (show_me, age prefs from profile)
 *     b. Get excluded IDs (swiped + blocked)
 *     c. Fetch candidates from DB
 *     d. Score & rank
 *     e. Cache top 100 in Redis
 *  3. Log stats
 */
async function precomputeQueues(): Promise<PrecomputeStats> {
  const start = performance.now();
  const stats: PrecomputeStats = {
    total_users: 0,
    processed: 0,
    cached: 0,
    errors: 0,
    duration_ms: 0,
  };

  try {
    const supabase = await createServiceClient();

    // 1. Fetch recently active users
    const activeThreshold = new Date(
      Date.now() - ACTIVE_THRESHOLD_HOURS * 60 * 60 * 1000,
    ).toISOString();

    const { data: activeUsers, error } = await supabase
      .from("users")
      .select(`
        user_id,
        show_me,
        date_of_birth,
        user_location!left (latitude, longitude),
        user_interests!left (interest)
      `)
      .eq("status", "active")
      .gte("last_active", activeThreshold)
      .limit(500);

    if (error || !activeUsers) {
      console.error("[PRECOMPUTE] Failed to fetch active users:", error?.message);
      stats.errors++;
      stats.duration_ms = performance.now() - start;
      return stats;
    }

    stats.total_users = activeUsers.length;

    // 2. Process in batches
    for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
      const batch = activeUsers.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const userId = user.user_id as string;

            // Check if queue already exists and is fresh
            try {
              const existing = await redis.get(CacheKeys.discoveryQueue(userId));
              if (existing) {
                const parsed = JSON.parse(existing);
                if (parsed.length > 20) {
                  // Queue still has plenty of profiles, skip
                  stats.processed++;
                  return;
                }
              }
            } catch {
              // Redis unavailable — continue anyway
            }

            const location = user.user_location as { latitude: number; longitude: number } | null;
            const interests = ((user.user_interests as { interest: string }[] | null) ?? []).map(
              (i) => i.interest,
            );

            // Get excluded IDs
            const excludedIds = await getExcludedIds(supabase, userId);

            // Fetch candidates
            const { data: candidates, error: fetchError } = await getCandidates(
              supabase,
              userId,
              {
                showMe: user.show_me as "hombres" | "mujeres" | "ambos",
                ageMin: 18,
                ageMax: 99,
              },
              excludedIds,
              CANDIDATES_LIMIT,
            );

            if (fetchError || candidates.length === 0) {
              stats.processed++;
              return;
            }

            // Score and rank
            const scored = scoreAndRankCandidates(
              candidates,
              location?.latitude ?? null,
              location?.longitude ?? null,
              interests,
            );

            // Convert to profiles and cache
            const profiles = scored.slice(0, QUEUE_SIZE).map(candidateToProfile);

            try {
              await redis.setex(
                CacheKeys.discoveryQueue(userId),
                CacheTTL.DISCOVERY_QUEUE,
                JSON.stringify(profiles),
              );
              stats.cached++;
            } catch {
              // Redis write failure
            }

            stats.processed++;
          } catch (err) {
            stats.errors++;
            console.error(
              "[PRECOMPUTE] Error processing user:",
              err instanceof Error ? err.message : "Unknown",
            );
          }
        }),
      );
    }
  } catch (err) {
    console.error("[PRECOMPUTE] Fatal error:", err);
    stats.errors++;
  }

  stats.duration_ms = Math.round(performance.now() - start);

  console.log(
    `[PRECOMPUTE] Done: ${stats.cached}/${stats.total_users} queues cached, ` +
    `${stats.errors} errors, ${stats.duration_ms}ms`,
  );

  return stats;
}

// ---------------------------------------------------------------------------
// Scheduler — runs precompute on interval
// ---------------------------------------------------------------------------

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPrecomputeScheduler() {
  if (intervalId) return; // Already running

  console.log(
    `[PRECOMPUTE] Scheduler started. Interval: ${PRECOMPUTE_INTERVAL_MS / 60000} min`,
  );

  // Run immediately on start
  precomputeQueues();

  // Then every 15 minutes
  intervalId = setInterval(precomputeQueues, PRECOMPUTE_INTERVAL_MS);
}

export function stopPrecomputeScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[PRECOMPUTE] Scheduler stopped.");
  }
}

// Export for API route to trigger manually
export { precomputeQueues };
