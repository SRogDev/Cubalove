import { NextRequest, NextResponse } from "next/server";
import { calculateWeeklyRecommendations } from "@/lib/services/recommendations";
import { sendToUser } from "@/lib/services/notifications";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import redis, { CacheKeys } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Maximum allowed execution time (Vercel pro: 300s, hobby: 60s)
export const maxDuration = 300;

/**
 * POST /api/recommendations/calculate
 *
 * Triggered weekly by pg_cron (see database.sql section 19.3) or any
 * external cron service. Protected by CRON_SECRET env var.
 *
 * To trigger manually:
 *   curl -X POST https://your-domain.com/api/recommendations/calculate \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(req: NextRequest) {
    // Auth check — reject requests without valid cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json(
            { error: "CRON_SECRET not configured" },
            { status: 500 },
        );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (token !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startedAt = Date.now();
    console.log("[recommendations/calculate] Starting weekly calculation...");

    const result = await calculateWeeklyRecommendations();

    const durationMs = Date.now() - startedAt;
    console.log("[recommendations/calculate] Done in", durationMs, "ms", result);

    if (result.error) {
        return NextResponse.json(
            { error: result.error, durationMs },
            { status: 500 },
        );
    }

    const { affectedUserIds } = result;

    // ── Flush Redis caches for all users who got new recommendations ───────────
    if (affectedUserIds.length > 0) {
        try {
            await Promise.all(
                affectedUserIds.map((uid) => redis.del(CacheKeys.recommendations(uid))),
            );
            console.log(`[recommendations/calculate] Flushed ${affectedUserIds.length} Redis cache(s)`);
        } catch (redisErr) {
            console.warn("[recommendations/calculate] Redis flush failed (non-fatal):", redisErr);
        }
    }

    // ── Push notifications ─────────────────────────────────────────────────────
    if (affectedUserIds.length > 0) {
        const service = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        let notifSent = 0;
        const notifErrors: string[] = [];

        await Promise.all(
            affectedUserIds.map(async (uid) => {
                const { sent, errors } = await sendToUser(service, uid, "new_recommendations");
                notifSent += sent;
                notifErrors.push(...errors);
            }),
        );

        console.log(
            `[recommendations/calculate] Notifications: ${notifSent} sent, ${notifErrors.length} error(s)`,
        );
    }

    return NextResponse.json({ ...result, durationMs });
}
