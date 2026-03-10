import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import * as RecommendationsRepo from "@/lib/repositories/recommendations";
import redis, { CacheKeys } from "@/lib/redis";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
    description: z.string().min(1).max(500),
});

/**
 * POST /api/recommendations/ideal-partner
 * Saves the user's ideal partner description.
 * Invalidates the existing ideal_embedding hash so it regenerates next week.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const service = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await RecommendationsRepo.upsertUserEmbedding(service, {
        user_id: user.id,
        ideal_partner_description: parsed.data.description,
        // Clear ideal hash so it regenerates next calculation cycle
        ideal_text_hash: null,
    });

    if (error) {
        return NextResponse.json({ error }, { status: 500 });
    }

    // Invalidate Redis cache so GET returns updated has_ideal_description immediately
    try {
        await redis.del(CacheKeys.recommendations(user.id));
    } catch {
        // Redis unavailable — not fatal
    }

    return NextResponse.json({ ok: true });
}
