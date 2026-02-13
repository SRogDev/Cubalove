import { SupabaseClient } from "@supabase/supabase-js";
import type { Chisme } from "@/lib/types";
import * as chismesRepo from "@/lib/repositories/chismes";

// ---------------------------------------------------------------------------
// Get Chismes Feed
// ---------------------------------------------------------------------------

/**
 * Retrieve the chismes feed for display.
 *
 * Returns active, non-expired chismes ordered by creation date (newest first).
 * Supports pagination through limit/offset.
 */
export async function getChismesFeed(
  supabase: SupabaseClient,
  limit: number = 10,
  offset: number = 0,
): Promise<{ data: Chisme[]; error: string | null }> {
  const { data, error } = await chismesRepo.getAll(supabase, limit, offset);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data as Chisme[]) ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Like / Unlike a Chisme (Toggle)
// ---------------------------------------------------------------------------

/**
 * Toggle a like on a chisme.
 *
 * If the user has already liked the chisme, the like is removed (unlike).
 * If the user has not liked it yet, a like is recorded.
 *
 * Returns the new liked state: `true` if liked, `false` if unliked.
 */
export async function likeChisme(
  supabase: SupabaseClient,
  chismeId: string,
  userId: string,
): Promise<{ liked: boolean; error: string | null }> {
  const { data, error } = await chismesRepo.toggleLike(supabase, chismeId, userId);

  if (error) {
    return { liked: false, error: error.message };
  }

  return { liked: data?.liked ?? false, error: null };
}

// ---------------------------------------------------------------------------
// Publish a Chisme (Admin)
// ---------------------------------------------------------------------------

/**
 * Create and publish a new chisme.
 *
 * This is an admin-level operation. The `createdBy` should be the admin's
 * user ID. If not provided, the function expects authentication context
 * from Supabase RLS.
 */
export async function publishChisme(
  supabase: SupabaseClient,
  content: Chisme["content"],
  imageUrl?: string | null,
  createdBy?: string,
): Promise<{ data: Chisme | null; error: string | null }> {
  if (!createdBy) {
    return { data: null, error: "Se requiere el ID del creador" };
  }

  if (!content.text || content.text.trim().length === 0) {
    return { data: null, error: "El contenido del chisme no puede estar vac\u00EDo" };
  }

  const { data, error } = await chismesRepo.create(
    supabase,
    content,
    imageUrl ?? undefined,
    createdBy,
  );

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Chisme | null, error: null };
}
