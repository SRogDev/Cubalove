import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getUserStats } from "@/lib/cache";

/**
 * GET /api/me/subscription — Lightweight endpoint for client components
 * to read subscription plan + current usage stats.
 * Plan comes from proxy.ts header, stats from user_stats table.
 * Uses React.cache() for per-request deduplication.
 */
export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const plan = headersList.get("x-subscription-plan") || "free";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: stats } = await getUserStats(userId);

  return NextResponse.json(
    { plan, stats },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
