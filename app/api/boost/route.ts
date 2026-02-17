import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  activateBoost,
  getActiveBoost,
  getPremiumInventory,
} from "@/lib/repositories/discovery";
import redis, { CacheKeys, CacheTTL } from "@/lib/redis";

// ---------------------------------------------------------------------------
// POST /api/boost — Activate a boost (30 min, 3x visibility)
//
// Requires Plus or VIP subscription, or available boost in inventory.
// Tinder-style: boost makes the user appear more frequently to others
// for 30 minutes by applying a 3x multiplier to their score.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const plan = request.headers.get("x-subscription-plan");

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if user already has an active boost
  const { data: existingBoost } = await getActiveBoost(supabase, userId);
  if (existingBoost) {
    return NextResponse.json(
      {
        error: "Ya tienes un boost activo",
        boost: existingBoost,
        expires_in_minutes: Math.ceil(
          (new Date(existingBoost.expires_at).getTime() - Date.now()) / 60000,
        ),
      },
      { status: 409 },
    );
  }

  // Check if user has boosts available (VIP gets 1 free/month, or purchased)
  if (plan !== "vip") {
    const { data: inventory } = await getPremiumInventory(supabase, userId);
    if (!inventory || inventory.boosts_available <= 0) {
      return NextResponse.json(
        { error: "No tienes boosts disponibles. Mejora a VIP o compra uno." },
        { status: 403 },
      );
    }

    // Decrement boost inventory
    const { error: decrementError } = await supabase
      .from("user_premium_inventory")
      .update({
        boosts_available: (inventory.boosts_available - 1),
      })
      .eq("user_id", userId)
      .gt("boosts_available", 0);

    if (decrementError) {
      return NextResponse.json(
        { error: "Error al usar boost" },
        { status: 500 },
      );
    }
  }

  // Activate the boost (30 min, 3x multiplier)
  const { data: boost, error } = await activateBoost(supabase, userId, 30, 3.0);

  if (error) {
    return NextResponse.json(
      { error: "Error al activar boost" },
      { status: 500 },
    );
  }

  // Cache boost in Redis for fast lookup during discovery
  try {
    await redis.setex(
      CacheKeys.activeBoost(userId),
      CacheTTL.ACTIVE_BOOST,
      JSON.stringify(boost),
    );
  } catch {
    // Redis failure non-critical — DB is source of truth
  }

  return NextResponse.json({
    success: true,
    boost,
    expires_in_minutes: 30,
    message: "¡Boost activado! Tu perfil será más visible por 30 minutos.",
  });
}

// ---------------------------------------------------------------------------
// GET /api/boost — Get current boost status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Try Redis first
  try {
    const cached = await redis.get(CacheKeys.activeBoost(userId));
    if (cached) {
      const boost = JSON.parse(cached);
      const expiresAt = new Date(boost.expires_at).getTime();
      if (expiresAt > Date.now()) {
        return NextResponse.json({
          active: true,
          boost,
          expires_in_minutes: Math.ceil((expiresAt - Date.now()) / 60000),
        });
      }
    }
  } catch {
    // Redis unavailable
  }

  // Fall back to DB
  const supabase = await createClient();
  const { data: boost } = await getActiveBoost(supabase, userId);

  if (boost) {
    return NextResponse.json({
      active: true,
      boost,
      expires_in_minutes: Math.ceil(
        (new Date(boost.expires_at).getTime() - Date.now()) / 60000,
      ),
    });
  }

  // Check inventory
  const { data: inventory } = await getPremiumInventory(supabase, userId);

  return NextResponse.json({
    active: false,
    boost: null,
    boosts_available: inventory?.boosts_available ?? 0,
  });
}
