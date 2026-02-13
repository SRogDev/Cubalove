import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import redis, { CacheKeys, CacheTTL } from "@/lib/redis";
import { getCandidates, getExcludedIds } from "@/lib/repositories/discovery";
import { scoreAndRankCandidates, candidateToProfile } from "@/lib/services/matching";
import { PerfLogger } from "@/lib/logger";
import type { DiscoveryFilters, UserProfile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANDIDATES_FETCH_LIMIT = 200;
const BATCH_SIZE = 20;

// ---------------------------------------------------------------------------
// GET /api/discovery
//
// Query params:
//   showMe    — "hombres" | "mujeres" | "ambos"
//   ageMin    — number (default 18)
//   ageMax    — number (default 99)
//   maxDistance — km (optional)
//   lat       — user latitude
//   lng       — user longitude
//
// Stateless pipeline:
//   1. Check Redis for cached queue → return next batch if exists
//   2. Fetch 200 candidates from DB (filtered)
//   3. Score & rank → keep top batch
//   4. Cache remaining in Redis
//   5. Return batch of 20 profiles
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const perf = new PerfLogger(userId);

  try {
    // --- Parse query params ---
    const params = request.nextUrl.searchParams;
    const filters: DiscoveryFilters = {
      showMe: (params.get("showMe") as DiscoveryFilters["showMe"]) || "ambos",
      ageMin: parseInt(params.get("ageMin") || "18", 10),
      ageMax: parseInt(params.get("ageMax") || "99", 10),
      maxDistanceKm: params.get("maxDistance")
        ? parseInt(params.get("maxDistance")!, 10)
        : undefined,
    };
    const userLat = params.get("lat") ? parseFloat(params.get("lat")!) : null;
    const userLng = params.get("lng") ? parseFloat(params.get("lng")!) : null;

    perf.mark("parse_params");

    // --- Step 1: Check Redis for cached queue ---
    const cacheKey = CacheKeys.discoveryQueue(userId);
    let cachedQueue: string | null = null;

    try {
      cachedQueue = await redis.get(cacheKey);
    } catch {
      // Redis unavailable — continue without cache
    }

    if (cachedQueue) {
      const queue: UserProfile[] = JSON.parse(cachedQueue);
      perf.mark("redis_hit", { cached_profiles: queue.length });

      if (queue.length > 0) {
        const batch = queue.splice(0, BATCH_SIZE);
        const remaining = queue.length;

        // Update cache with remaining profiles
        if (remaining > 0) {
          try {
            await redis.setex(
              cacheKey,
              CacheTTL.DISCOVERY_QUEUE,
              JSON.stringify(queue),
            );
          } catch {
            // Redis write failure — non-critical
          }
        } else {
          try {
            await redis.del(cacheKey);
          } catch {
            // Redis delete failure — non-critical
          }
        }

        perf.mark("batch_from_cache", { batch_size: batch.length, remaining });
        const perfData = perf.flush();

        return NextResponse.json({
          profiles: batch,
          remaining,
          total_scored: batch.length + remaining,
          perf: perfData,
        });
      }
    }

    perf.mark("redis_miss");

    // --- Step 2: Fetch excluded IDs (swiped + blocked) ---
    const supabase = await createClient();
    const excludedIds = await getExcludedIds(supabase, userId);
    perf.mark("fetch_excluded", { excluded_count: excludedIds.length });

    // Also track shown profiles in Redis (30-day cooldown)
    let shownIds: string[] = [];
    try {
      const shownKey = CacheKeys.shownProfiles(userId);
      const shownData = await redis.get(shownKey);
      if (shownData) {
        shownIds = JSON.parse(shownData);
      }
    } catch {
      // Redis unavailable
    }

    const allExcluded = [...new Set([...excludedIds, ...shownIds])];
    perf.mark("merge_exclusions", { total_excluded: allExcluded.length });

    // --- Step 3: Fetch user's own interests for scoring ---
    const { data: userInterestsData } = await supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", userId);
    const userInterests = (userInterestsData ?? []).map((i) => i.interest);
    perf.mark("fetch_user_interests", { count: userInterests.length });

    // --- Step 4: Fetch candidates from DB ---
    const { data: candidates, error } = await getCandidates(
      supabase,
      userId,
      {
        showMe: filters.showMe,
        ageMin: filters.ageMin,
        ageMax: filters.ageMax,
        maxDistanceKm: filters.maxDistanceKm,
        userLat: userLat ?? undefined,
        userLng: userLng ?? undefined,
      },
      allExcluded,
      CANDIDATES_FETCH_LIMIT,
    );

    if (error) {
      perf.mark("db_error", { error });
      perf.flush();
      return NextResponse.json({ error }, { status: 500 });
    }

    perf.mark("fetch_candidates", {
      candidates_count: candidates.length,
      db_payload_size_approx: JSON.stringify(candidates).length,
    });

    if (candidates.length === 0) {
      perf.mark("no_candidates");
      const perfData = perf.flush();
      return NextResponse.json({
        profiles: [],
        remaining: 0,
        total_scored: 0,
        perf: perfData,
      });
    }

    // --- Step 5: Score & rank all candidates ---
    const scored = scoreAndRankCandidates(
      candidates,
      userLat,
      userLng,
      userInterests,
    );

    // Apply maxDistance filter post-scoring if set
    let filtered = scored;
    if (filters.maxDistanceKm) {
      filtered = scored.filter(
        (c) =>
          c.distance_km === null || c.distance_km <= filters.maxDistanceKm!,
      );
    }

    perf.mark("score_and_rank", {
      scored_count: scored.length,
      filtered_count: filtered.length,
      top_score: filtered[0]?.score ?? 0,
      bottom_score: filtered[filtered.length - 1]?.score ?? 0,
    });

    // --- Step 6: Split into batch + remaining, convert to profiles ---
    const allProfiles = filtered.map(candidateToProfile);
    const batch = allProfiles.splice(0, BATCH_SIZE);
    const remaining = allProfiles.length;

    // --- Step 7: Cache remaining in Redis ---
    if (remaining > 0) {
      try {
        await redis.setex(
          cacheKey,
          CacheTTL.DISCOVERY_QUEUE,
          JSON.stringify(allProfiles),
        );
      } catch {
        // Redis write failure — non-critical
      }
    }

    // Track all shown profile IDs in Redis (for 30-day cooldown)
    try {
      const shownKey = CacheKeys.shownProfiles(userId);
      const newShownIds = [
        ...shownIds,
        ...filtered.map((c) => c.user_id),
      ];
      await redis.setex(
        shownKey,
        CacheTTL.SHOWN_PROFILES,
        JSON.stringify(newShownIds),
      );
    } catch {
      // Redis unavailable
    }

    perf.mark("cache_remaining", { batch_size: batch.length, remaining });
    const perfData = perf.flush();

    // --- Step 8: Update user's last_active ---
    supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("user_id", userId)
      .then(() => {});

    return NextResponse.json({
      profiles: batch,
      remaining,
      total_scored: filtered.length,
      perf: perfData,
    });
  } catch (err) {
    perf.mark("unhandled_error", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    perf.flush();
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
