export type Gender = "hombre" | "mujer" | "otro";
export type ShowMe = "hombres" | "mujeres" | "ambos";
export type SwipeType = "like" | "nope" | "superlike";
export type SubscriptionPlan = "plus" | "vip";
export type SubscriptionStatus = "active" | "inactive" | "canceled";
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended" | "blocked";
export type PaymentMethod = "cup_manual";
export type ReportReason = "fake" | "inappropriate" | "harassment" | "minor" | "spam" | "other";
export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";

export interface UserProfile {
  user_id: string;
  display_name: string;
  date_of_birth: string;
  gender: Gender;
  show_me: ShowMe;
  bio: string | null;
  work_study: string | null;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  onboarding_completed: boolean;
  suspended_until?: string | null;
  last_active: string;
  photos: UserPhoto[];
  prompts: UserPrompt[];
  interests: string[];
  location: UserLocation | null;
}

export interface UserPhoto {
  id: string;
  url: string;
  position: number;
}

export interface UserPrompt {
  id: string;
  prompt_text: string;
  answer_text: string;
  position: number;
}

export interface UserLocation {
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Match {
  id: string;
  user: UserProfile;
  created_at: string;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Chisme {
  id: string;
  content: {
    text: string;
    type?: string;
    cta?: string;
    link?: string;
    media_url?: string;
    media_type?: "image" | "video" | "audio" | "document";
    media_name?: string;
  };
  image_url: string | null;
  views: number;
  likes: number;
  clicks: number;
  created_at: string;
}

// Couple Mode types
export interface CoupleRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  active: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface CoupleVault {
  id: string;
  room_id: string;
  favorite_song_url: string | null;
  favorite_song_title: string | null;
  favorite_song_artist: string | null;
  photo_1_url: string | null;
  photo_2_url: string | null;
  photo_3_url: string | null;
}

export interface CoupleDiaryEntry {
  id: string;
  room_id: string;
  author_id: string;
  content: string;
  entry_date: string;
  created_at: string;
}

export interface CoupleRequest {
  id: string;
  requester_id: string;
  target_phone: string;
  target_name: string;
  target_id: string | null;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at: string;
}

export interface UserStats {
  likes_given: number;
  likes_received: number;
  superlikes_given: number;
  superlikes_received: number;
  matches_count: number;
  swipes_today: number;
  superlikes_today: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  payment_method: PaymentMethod;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface CupPrice {
  id: string;
  plan: SubscriptionPlan;
  price_cup: number;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReceivedLike {
  user_id: string;
  display_name: string;
  date_of_birth: string;
  gender: Gender;
  bio: string | null;
  photos: UserPhoto[];
  swipe_type: "like" | "superlike";
  swiped_at: string;
}

export interface AdminInsight {
  id: string;
  title: string;
  description: string;
  category: "matching" | "demographics" | "engagement" | "growth";
  value: string;
}

// ---------------------------------------------------------------------------
// Discovery / Matching Algorithm Types
// ---------------------------------------------------------------------------

export interface DiscoveryCandidate {
  user_id: string;
  display_name: string;
  date_of_birth: string;
  gender: Gender;
  bio: string | null;
  work_study: string | null;
  last_active: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  interests: string[];
  photos: UserPhoto[];
  prompts: UserPrompt[];
  plan: SubscriptionPlan | null;
  has_active_boost: boolean;
  boost_multiplier: number;
}

export interface ScoredCandidate extends DiscoveryCandidate {
  score: number;
  score_breakdown: {
    distance: number;
    interests: number;
    activity: number;
    random: number;
    boost_multiplier: number;
    plan_multiplier: number;
  };
  distance_km: number | null;
}

export interface DiscoveryFilters {
  showMe: ShowMe;
  ageMin: number;
  ageMax: number;
  maxDistanceKm?: number;
}

export interface DiscoveryResponse {
  profiles: UserProfile[];
  remaining: number;
  total_scored: number;
  perf?: Record<string, unknown>;
}

export interface Boost {
  id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
  multiplier: number;
}

export interface PremiumInventory {
  user_id: string;
  boosts_available: number;
  superlikes_available: number;
}

// ---------------------------------------------------------------------------
// AI Recommendation System
// ---------------------------------------------------------------------------

export type RecommendationStatus = "active" | "past";

/** Raw row from the recommendations table */
export interface Recommendation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  score_a_to_b: number;     // cosine similarity A’s ideal → B’s profile (0–1)
  score_b_to_a: number;     // cosine similarity B’s ideal → A’s profile (0–1)
  compatibility_score: number; // (score_a_to_b + score_b_to_a) / 2
  status: RecommendationStatus;
  week_start: string;       // ISO date string (Monday)
  created_at: string;
}

/** Profile enriched with the user’s directional compatibility score */
export interface RecommendedProfile extends UserProfile {
  /** Score “what this person wants → who you are” (0–1) */
  score_toward_me: number;
  /** Score “what you want → who this person is” (0–1) */
  score_toward_them: number;
  /** Average of both directions */
  compatibility_score: number;
}

export interface RecommendationsResponse {
  recommendations: RecommendedProfile[];
  week_start: string | null;
  next_refresh: string; // ISO date of next Monday
  /** Whether the user has already written their ideal partner description */
  has_ideal_description: boolean;
}

/** Payload stored in user_embeddings */
export interface UserEmbedding {
  user_id: string;
  ideal_partner_description: string | null;
  updated_at: string;
  // Note: actual vectors are not returned to the client
}
