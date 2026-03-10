import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as RecommendationsRepo from "@/lib/repositories/recommendations";
import redis, { CacheKeys, CacheTTL } from "@/lib/redis";
import type { RecommendationsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/recommendations
// Returns the calling user's active recommendations (up to 5 profiles)
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Redis cache check ──────────────────────────────────────────────────────
  const cacheKey = CacheKeys.recommendations(user.id);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string), {
        headers: { "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400" },
      });
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // Use service role for the cross-user join
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [recsResult, embeddingResult] = await Promise.all([
    RecommendationsRepo.getActiveRecommendations(service, user.id),
    RecommendationsRepo.getIdealPartnerDescription(service, user.id),
  ]);

  if (recsResult.error) {
    return NextResponse.json({ error: recsResult.error }, { status: 500 });
  }

  const has_ideal_description =
    typeof embeddingResult.data === "string" && embeddingResult.data.trim().length > 0;

  // Determine week_start and next recalculation (next Monday)
  const weekStart = getWeekStart();
  const nextRefresh = getNextMonday();

  const response: RecommendationsResponse = {
    recommendations: recsResult.data,
    week_start: weekStart,
    next_refresh: nextRefresh,
    has_ideal_description,
  };

  // ── Store in Redis ─────────────────────────────────────────────────────────
  try {
    await redis.set(cacheKey, JSON.stringify(response), "EX", CacheTTL.RECOMMENDATIONS);
  } catch {
    // Redis unavailable — not fatal
  }

  return NextResponse.json(response, {
    headers: {
      // Cache for 1 hour — stale-while-revalidate for fast repeat opens
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(3, 0, 0, 0);
  return next.toISOString();
}
