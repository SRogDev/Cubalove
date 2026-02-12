export type Gender = "hombre" | "mujer" | "otro";
export type ShowMe = "hombres" | "mujeres" | "ambos";
export type SwipeType = "like" | "nope" | "superlike";
export type SubscriptionPlan = "plus" | "vip";
export type SubscriptionStatus = "active" | "inactive" | "canceled";

export interface UserProfile {
  user_id: string;
  display_name: string;
  date_of_birth: string;
  gender: Gender;
  show_me: ShowMe;
  bio: string | null;
  work_study: string | null;
  last_active: string;
  photos: UserPhoto[];
  prompts: UserPrompt[];
  interests: string[];
  location: UserLocation | null;
  phone?: string;
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
