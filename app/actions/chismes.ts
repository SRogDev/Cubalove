"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import * as ChismesRepo from "@/lib/repositories/chismes";

// ---------------------------------------------------------------------------
// Get chismes feed (paginated)
// ---------------------------------------------------------------------------
export async function getChismes(page: number = 0, limit: number = 20) {
    const supabase = await createClient();
    const offset = page * limit;

    const { data, error } = await ChismesRepo.getAll(supabase, limit, offset);

    if (error) return { error: "Error al cargar chismes" };
    return { success: true, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// Toggle like on a chisme
// ---------------------------------------------------------------------------
export async function toggleChismeLike(chismeId: string) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    if (!chismeId) return { error: "ID de chisme inválido" };

    const supabase = await createClient();
    const { data, error } = await ChismesRepo.toggleLike(supabase, chismeId, userId);

    if (error) return { error: "Error al dar like" };
    return { success: true, liked: data?.liked ?? false };
}

// ---------------------------------------------------------------------------
// Track chisme interaction (view, click, share)
// ---------------------------------------------------------------------------
export async function trackChismeInteraction(
    chismeId: string,
    type: "view" | "click" | "share",
) {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    if (!userId) return { error: "No autorizado" };

    const supabase = await createClient();
    await ChismesRepo.trackInteraction(supabase, chismeId, userId, type);

    return { success: true };
}
