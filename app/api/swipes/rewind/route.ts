import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/constants/subscription";

/**
 * POST /api/swipes/rewind — Undo the last swipe.
 * Requires Plus or VIP subscription.
 * The database trigger `revert_stats_on_swipe_delete` handles:
 *   - Reverting stats (likes_given, superlikes_today, etc.)
 *   - Unmatching if a match was created from that swipe
 */
export async function POST() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const plan = headersList.get("x-subscription-plan") || "free";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = getPlanLimits(plan);
  if (!limits.canRewind) {
    return NextResponse.json(
      { error: "Se requiere Plus o VIP para deshacer", requiresUpgrade: true },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  // Get the most recent swipe
  const { data: lastSwipe, error: fetchError } = await supabase
    .from("swipes")
    .select("id, target_id, type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !lastSwipe) {
    return NextResponse.json(
      { error: "No hay swipe para deshacer" },
      { status: 404 },
    );
  }

  // Delete the swipe — trigger handles stats revert + unmatch
  const { error: deleteError } = await supabase
    .from("swipes")
    .delete()
    .eq("id", lastSwipe.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    rewound_profile_id: lastSwipe.target_id,
    swipe_type: lastSwipe.type,
  });
}
