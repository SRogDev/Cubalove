import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/constants/subscription";

/**
 * GET /api/likes/received — Fetch profiles that liked/superliked the current user.
 * Requires Plus or VIP subscription.
 */
export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const plan = headersList.get("x-subscription-plan") || "free";

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = getPlanLimits(plan);
  if (!limits.canSeeLikes) {
    return NextResponse.json(
      { likes: [], requiresUpgrade: true },
      { status: 403, headers: { "Cache-Control": "private, no-cache" } },
    );
  }

  const supabase = await createClient();

  // Get swipes targeting this user (like/superlike only)
  const { data: swipes, error } = await supabase
    .from("swipes")
    .select("user_id, type, created_at")
    .eq("target_id", userId)
    .in("type", ["like", "superlike"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!swipes || swipes.length === 0) {
    return NextResponse.json({ likes: [] });
  }

  // Fetch profiles of likers — parallel fetch (async-parallel best practice)
  const likerIds = swipes.map((s) => s.user_id);

  const [profilesRes, photosRes] = await Promise.all([
    supabase
      .from("users")
      .select("user_id, display_name, date_of_birth, gender, bio")
      .in("user_id", likerIds),
    supabase
      .from("user_photos")
      .select("user_id, id, url, position")
      .in("user_id", likerIds)
      .order("position", { ascending: true }),
  ]);

  // Build profile map (js-index-maps best practice)
  const profileMap = new Map<
    string,
    { user_id: string; display_name: string; date_of_birth: string; gender: string; bio: string | null; photos: Array<{ id: string; url: string; position: number }> }
  >();

  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.user_id, { ...p, photos: [] });
  }
  for (const photo of photosRes.data ?? []) {
    profileMap.get(photo.user_id)?.photos.push({
      id: photo.id,
      url: photo.url,
      position: photo.position,
    });
  }

  const likes = swipes
    .map((s) => {
      const profile = profileMap.get(s.user_id);
      if (!profile) return null;
      return {
        ...profile,
        swipe_type: s.type,
        swiped_at: s.created_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json(
    { likes },
    { headers: { "Cache-Control": "private, no-cache" } },
  );
}
