export type Gender = "hombre" | "mujer" | "otro";
export type ShowMe = "hombres" | "mujeres" | "ambos";
export type SwipeType = "like" | "nope" | "superlike";
export type SubscriptionPlan = "plus" | "vip";
export type SubscriptionStatus = "active" | "inactive" | "canceled";
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended" | "blocked";
export type PaymentMethod = "stripe" | "cup_manual";
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
  };
  image_url: string | null;
  views: number;
  likes: number;
  clicks: number;
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
