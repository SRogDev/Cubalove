import { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile, UserStatus } from "@/lib/types";

/**
 * Get a user profile by ID with photos, prompts, interests, and location.
 */
export async function getById(supabase: SupabaseClient, userId: string) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (userError) return { data: null, error: userError };

  const [photosRes, promptsRes, interestsRes, locationRes] = await Promise.all([
    supabase
      .from("user_photos")
      .select("id, url, position")
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("user_prompts")
      .select("id, prompt_text, answer_text, position")
      .eq("user_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("user_interests")
      .select("interest")
      .eq("user_id", userId),
    supabase
      .from("user_location")
      .select("city, latitude, longitude")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const profile: UserProfile = {
    ...user,
    photos: photosRes.data ?? [],
    prompts: promptsRes.data ?? [],
    interests: (interestsRes.data ?? []).map((i) => i.interest),
    location: locationRes.data ?? null,
  };

  return { data: profile, error: null };
}

/**
 * Update user profile fields (display_name, bio, work_study, etc.).
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<
    Pick<
      UserProfile,
      "display_name" | "date_of_birth" | "gender" | "show_me" | "bio" | "work_study" | "phone"
    >
  >,
) {
  return supabase
    .from("users")
    .update(data)
    .eq("user_id", userId)
    .select()
    .single();
}

/**
 * Admin: update user status (active, suspended, blocked).
 */
export async function updateStatus(
  supabase: SupabaseClient,
  userId: string,
  status: UserStatus,
  suspendedUntil?: string,
) {
  return supabase
    .from("users")
    .update({
      status,
      suspended_until: status === "suspended" ? suspendedUntil : null,
    })
    .eq("user_id", userId)
    .select()
    .single();
}

/**
 * Find a user by phone number.
 */
export async function getByPhone(supabase: SupabaseClient, phone: string) {
  return supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
}

/**
 * Admin: get all users with their report counts.
 * Uses service role client — bypasses RLS.
 */
export async function getAllWithReportCounts(supabase: SupabaseClient) {
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("user_id, display_name, gender, status, role, created_at, last_active")
    .order("created_at", { ascending: false });

  if (usersError) return { data: null, error: usersError };

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("reported_id");

  if (reportsError) return { data: null, error: reportsError };

  const reportCounts = (reports ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.reported_id] = (acc[r.reported_id] || 0) + 1;
    return acc;
  }, {});

  const usersWithReports = (users ?? []).map((u) => ({
    ...u,
    report_count: reportCounts[u.user_id] || 0,
  }));

  return { data: usersWithReports, error: null };
}
