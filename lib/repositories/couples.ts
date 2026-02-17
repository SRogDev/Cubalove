import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Couple Repositories — DB access for couple mode
// ---------------------------------------------------------------------------

/**
 * Find a user by phone number AND display_name (for couple linking).
 */
export async function findUserByPhoneAndName(
  supabase: SupabaseClient,
  phone: string,
  displayName: string,
) {
  return supabase
    .from("users")
    .select("user_id, display_name, phone")
    .eq("phone", phone)
    .ilike("display_name", displayName)
    .eq("status", "active")
    .maybeSingle();
}

/**
 * Create a couple linking request.
 */
export async function createCoupleRequest(
  supabase: SupabaseClient,
  requesterId: string,
  targetId: string,
  targetPhone: string,
  targetName: string,
) {
  return supabase
    .from("couple_requests")
    .insert({
      requester_id: requesterId,
      target_id: targetId,
      target_phone: targetPhone,
      target_name: targetName,
    })
    .select()
    .single();
}

/**
 * Get pending couple requests for a user (they are the target).
 */
export async function getPendingRequests(
  supabase: SupabaseClient,
  userId: string,
) {
  return supabase
    .from("couple_requests")
    .select(`
      id,
      requester_id,
      target_name,
      status,
      created_at,
      requester:users!couple_requests_requester_id_fkey (
        display_name,
        user_photos (url, position)
      )
    `)
    .eq("target_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
}

/**
 * Accept a couple request → create couple_room.
 */
export async function acceptCoupleRequest(
  supabase: SupabaseClient,
  requestId: string,
  userId: string,
) {
  // Update request status
  const { data: request, error: updateError } = await supabase
    .from("couple_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("target_id", userId)
    .eq("status", "pending")
    .select("requester_id")
    .single();

  if (updateError || !request) {
    return { data: null, error: updateError?.message || "Solicitud no encontrada" };
  }

  // Create couple room (user1_id < user2_id)
  const user1 = request.requester_id < userId ? request.requester_id : userId;
  const user2 = request.requester_id < userId ? userId : request.requester_id;

  const { data: room, error: roomError } = await supabase
    .from("couple_rooms")
    .insert({ user1_id: user1, user2_id: user2 })
    .select()
    .single();

  if (roomError) {
    return { data: null, error: roomError.message };
  }

  return { data: room, error: null };
}

/**
 * Reject a couple request (creates harassment report).
 */
export async function rejectCoupleRequest(
  supabase: SupabaseClient,
  requestId: string,
  userId: string,
  reportAsHarassment: boolean = false,
) {
  const { data: request, error } = await supabase
    .from("couple_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("target_id", userId)
    .eq("status", "pending")
    .select("requester_id")
    .single();

  if (error || !request) {
    return { error: error?.message || "Solicitud no encontrada" };
  }

  if (reportAsHarassment) {
    await supabase.from("reports").insert({
      reporter_id: userId,
      reported_id: request.requester_id,
      reason: "harassment",
      details: "Solicitud de pareja no deseada",
    });
  }

  return { error: null };
}

/**
 * Get the active couple room for a user.
 */
export async function getActiveCoupleRoom(
  supabase: SupabaseClient,
  userId: string,
) {
  return supabase
    .from("couple_rooms")
    .select(`
      id,
      user1_id,
      user2_id,
      started_at,
      partner1:users!couple_rooms_user1_id_fkey (
        user_id, display_name, user_photos (url, position)
      ),
      partner2:users!couple_rooms_user2_id_fkey (
        user_id, display_name, user_photos (url, position)
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("active", true)
    .maybeSingle();
}

/**
 * Get the couple vault for a room.
 */
export async function getCoupleVault(
  supabase: SupabaseClient,
  roomId: string,
) {
  return supabase
    .from("couple_vault")
    .select("*")
    .eq("room_id", roomId)
    .single();
}

/**
 * Update the couple vault (song, photos).
 */
export async function updateCoupleVault(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
  data: {
    favorite_song_url?: string;
    favorite_song_title?: string;
    favorite_song_artist?: string;
    photo_1_url?: string;
    photo_2_url?: string;
    photo_3_url?: string;
  },
) {
  return supabase
    .from("couple_vault")
    .update({ ...data, updated_by: userId })
    .eq("room_id", roomId)
    .select()
    .single();
}

/**
 * Get diary entries for a couple room, ordered by date.
 */
export async function getDiaryEntries(
  supabase: SupabaseClient,
  roomId: string,
) {
  return supabase
    .from("couple_diary")
    .select(`
      id,
      content,
      entry_date,
      created_at,
      author:users!couple_diary_author_id_fkey (
        user_id, display_name
      )
    `)
    .eq("room_id", roomId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: true });
}

/**
 * Write a diary entry (max 1 per user per day, enforced by DB UNIQUE).
 */
export async function writeDiaryEntry(
  supabase: SupabaseClient,
  roomId: string,
  authorId: string,
  content: string,
) {
  return supabase
    .from("couple_diary")
    .insert({
      room_id: roomId,
      author_id: authorId,
      content,
    })
    .select()
    .single();
}

/**
 * End a couple relationship (deactivate room).
 */
export async function endCouple(
  supabase: SupabaseClient,
  roomId: string,
) {
  return supabase
    .from("couple_rooms")
    .update({ active: false, ended_at: new Date().toISOString() })
    .eq("id", roomId)
    .select()
    .single();
}
