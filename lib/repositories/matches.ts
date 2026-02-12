import { SupabaseClient } from "@supabase/supabase-js";
import type { Match, UserProfile } from "@/lib/types";

/**
 * Get all active matches for a user with partner profile info.
 * Ordered by last_message_at (most recent conversation first), then by created_at.
 */
export async function getByUser(supabase: SupabaseClient, userId: string) {
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      user1_id,
      user2_id,
      last_message_at,
      created_at
    `,
    )
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("unmatched", false)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return { data: null, error };
  if (!matches || matches.length === 0) return { data: [], error: null };

  // Get partner IDs
  const partnerIds = matches.map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id,
  );

  // Fetch partner profiles with photos
  const { data: partners, error: partnersError } = await supabase
    .from("users")
    .select("user_id, display_name, date_of_birth, gender, show_me, bio, work_study, role, status, last_active")
    .in("user_id", partnerIds);

  if (partnersError) return { data: null, error: partnersError };

  const { data: photos, error: photosError } = await supabase
    .from("user_photos")
    .select("user_id, id, url, position")
    .in("user_id", partnerIds)
    .order("position", { ascending: true });

  if (photosError) return { data: null, error: photosError };

  // Build a map of partner data
  const partnerMap = new Map<string, UserProfile>();
  for (const p of partners ?? []) {
    partnerMap.set(p.user_id, {
      ...p,
      photos: [],
      prompts: [],
      interests: [],
      location: null,
    } as UserProfile);
  }

  for (const photo of photos ?? []) {
    const partner = partnerMap.get(photo.user_id);
    if (partner) {
      partner.photos.push({
        id: photo.id,
        url: photo.url,
        position: photo.position,
      });
    }
  }

  const result: Match[] = matches.map((m) => {
    const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
    return {
      id: m.id,
      user: partnerMap.get(partnerId)!,
      created_at: m.created_at,
      last_message_at: m.last_message_at,
    };
  });

  return { data: result, error: null };
}

/**
 * Get a single match by ID, verifying the user is a participant.
 * Returns match with partner profile info.
 */
export async function getById(
  supabase: SupabaseClient,
  matchId: string,
  userId: string,
) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, unmatched, last_message_at, created_at")
    .eq("id", matchId)
    .single();

  if (error) return { data: null, error };

  // Verify user is a participant
  if (match.user1_id !== userId && match.user2_id !== userId) {
    return { data: null, error: { message: "Not a participant in this match" } };
  }

  const partnerId =
    match.user1_id === userId ? match.user2_id : match.user1_id;

  // Fetch partner profile with photos
  const { data: partner, error: partnerError } = await supabase
    .from("users")
    .select("user_id, display_name, date_of_birth, gender, show_me, bio, work_study, role, status, last_active")
    .eq("user_id", partnerId)
    .single();

  if (partnerError) return { data: null, error: partnerError };

  const { data: photos } = await supabase
    .from("user_photos")
    .select("id, url, position")
    .eq("user_id", partnerId)
    .order("position", { ascending: true });

  const result: Match = {
    id: match.id,
    user: {
      ...partner,
      photos: photos ?? [],
      prompts: [],
      interests: [],
      location: null,
    } as UserProfile,
    created_at: match.created_at,
    last_message_at: match.last_message_at,
  };

  return { data: result, error: null };
}
