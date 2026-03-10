"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSwipeSchema, type CreateSwipeInput } from "@/lib/schemas";
import { getPlanLimits } from "@/lib/constants/subscription";

/**
 * Server action to create a swipe (like, nope, superlike).
 * DB triggers handle: match creation, stats update, notifications.
 *
 * Returns:
 *  - success: true + match info if it resulted in a match
 *  - error: string if validation/limit fails
 */
export async function createSwipe(input: CreateSwipeInput) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const plan = headersList.get("x-subscription-plan") || "free";

    if (!userId) {
        return { error: "No autorizado" };
    }

    // Validate input
    const parsed = createSwipeSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Datos de swipe inválidos" };
    }

    const { targetId, type } = parsed.data;

    if (userId === targetId) {
        return { error: "No puedes darte swipe a ti mismo" };
    }

    const supabase = await createClient();
    const limits = getPlanLimits(plan);

    // Check daily limits
    const { data: stats } = await supabase
        .from("user_stats")
        .select("swipes_today, superlikes_today")
        .eq("user_id", userId)
        .single();

    if (stats) {
        if (
            type !== "nope" &&
            limits.likesPerPeriod !== Infinity &&
            stats.swipes_today >= limits.likesPerPeriod
        ) {
            return {
                error: "Has llegado al límite de likes. Vuelve más tarde o mejora tu plan.",
                requiresUpgrade: true,
            };
        }

        if (type === "superlike" && stats.superlikes_today >= limits.superlikesPerDay) {
            return {
                error: "Has usado todos tus Super Likes de hoy.",
                requiresUpgrade: true,
            };
        }
    }

    // Create the swipe — DB trigger handles match creation + stats
    const { error: swipeError } = await supabase
        .from("swipes")
        .insert({
            user_id: userId,
            target_id: targetId,
            type,
        });

    if (swipeError) {
        // Duplicate swipe (already swiped this user)
        if (swipeError.code === "23505") {
            return { error: "Ya hiciste swipe a este perfil" };
        }
        return { error: "Error al procesar swipe" };
    }

    // Check if a match was created (the DB trigger creates it on mutual like)
    let matched = false;
    let matchId: string | null = null;

    if (type !== "nope") {
        // DB stores user1_id < user2_id (LEAST/GREATEST ordering)
        const user1 = userId < targetId ? userId : targetId;
        const user2 = userId < targetId ? targetId : userId;

        const { data: matchData } = await supabase
            .from("matches")
            .select("id")
            .eq("user1_id", user1)
            .eq("user2_id", user2)
            .eq("unmatched", false)
            .maybeSingle();

        if (matchData) {
            matched = true;
            matchId = matchData.id;
        }
    }

    return {
        success: true,
        matched,
        matchId,
        type,
    };
}
