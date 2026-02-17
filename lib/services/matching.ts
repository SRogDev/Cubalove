import { getDistance } from "geolib";
import type {
  DiscoveryCandidate,
  ScoredCandidate,
  UserProfile,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Scoring Weights (total = 100)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  DISTANCE: 0.40,    // 40%
  INTERESTS: 0.30,   // 30%
  ACTIVITY: 0.20,    // 20%
  RANDOM: 0.10,      // 10%
} as const;

const MAX_SCORE = 100;

// ---------------------------------------------------------------------------
// Distance Scoring
// ---------------------------------------------------------------------------

function scoreDistance(distanceKm: number | null): number {
  if (distanceKm === null) return 10; // Unknown distance — give modest score
  if (distanceKm <= 5) return 40;
  if (distanceKm <= 15) return 25;
  if (distanceKm <= 50) return 10;
  return 0;
}

function calculateDistanceKm(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const meters = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 },
  );
  return meters / 1000;
}

// ---------------------------------------------------------------------------
// Interests Scoring
// ---------------------------------------------------------------------------

function scoreInterests(
  candidateInterests: string[],
  userInterests: string[],
): number {
  if (userInterests.length === 0 || candidateInterests.length === 0) return 0;
  let shared = 0;
  const userSet = new Set(userInterests);
  for (const interest of candidateInterests) {
    if (userSet.has(interest)) shared++;
  }
  // 15 points per shared interest, capped at 30 (max weight)
  return Math.min(shared * 15, 30);
}

// ---------------------------------------------------------------------------
// Activity Scoring
// ---------------------------------------------------------------------------

function scoreActivity(lastActive: string): number {
  const lastActiveDate = new Date(lastActive);
  const now = Date.now();
  const diffHours = (now - lastActiveDate.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) return 20;       // Active today
  if (diffHours <= 24 * 7) return 10;   // Active this week
  return 0;                              // Inactive
}

// ---------------------------------------------------------------------------
// Random Factor
// ---------------------------------------------------------------------------

function scoreRandom(): number {
  return Math.random() * 10;
}

// ---------------------------------------------------------------------------
// Plan Multiplier
// ---------------------------------------------------------------------------

function getPlanMultiplier(plan: string | null): number {
  if (plan === "vip") return 1.5;    // +50%
  if (plan === "plus") return 1.2;   // +20%
  return 1.0;
}

// ---------------------------------------------------------------------------
// Main Scoring Function
// ---------------------------------------------------------------------------

/**
 * Score a list of candidates against the current user's profile.
 * Returns candidates sorted by score descending.
 *
 * Complexity: O(n) where n = candidates.length
 * Memory: minimal — operates on existing objects
 */
export function scoreAndRankCandidates(
  candidates: DiscoveryCandidate[],
  userLat: number | null,
  userLng: number | null,
  userInterests: string[],
): ScoredCandidate[] {
  const scored: ScoredCandidate[] = new Array(candidates.length);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];

    const distanceKm = calculateDistanceKm(userLat, userLng, c.latitude, c.longitude);
    const distScore = scoreDistance(distanceKm);
    const intScore = scoreInterests(c.interests, userInterests);
    const actScore = scoreActivity(c.last_active);
    const rndScore = scoreRandom();

    // Weighted raw score
    let rawScore =
      distScore * WEIGHTS.DISTANCE +
      intScore * WEIGHTS.INTERESTS +
      actScore * WEIGHTS.ACTIVITY +
      rndScore * WEIGHTS.RANDOM;

    // Apply plan multiplier (the candidate's plan boosts their visibility)
    const planMultiplier = getPlanMultiplier(c.plan);
    rawScore *= planMultiplier;

    // Apply boost multiplier (3x default when boosted)
    if (c.has_active_boost) {
      rawScore *= c.boost_multiplier;
    }

    // Cap at a reasonable max (multipliers can push it over 100)
    const finalScore = Math.min(rawScore, MAX_SCORE * 3);

    scored[i] = {
      ...c,
      score: Math.round(finalScore * 100) / 100,
      score_breakdown: {
        distance: Math.round(distScore * WEIGHTS.DISTANCE * 100) / 100,
        interests: Math.round(intScore * WEIGHTS.INTERESTS * 100) / 100,
        activity: Math.round(actScore * WEIGHTS.ACTIVITY * 100) / 100,
        random: Math.round(rndScore * WEIGHTS.RANDOM * 100) / 100,
        boost_multiplier: c.has_active_boost ? c.boost_multiplier : 1.0,
        plan_multiplier: planMultiplier,
      },
      distance_km: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
    };
  }

  // Sort descending by score — fast in-place sort
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

// ---------------------------------------------------------------------------
// Convert ScoredCandidate → UserProfile (for API response)
// ---------------------------------------------------------------------------

export function candidateToProfile(candidate: ScoredCandidate): UserProfile {
  return {
    user_id: candidate.user_id,
    display_name: candidate.display_name,
    date_of_birth: candidate.date_of_birth,
    gender: candidate.gender,
    show_me: "ambos", // Not relevant in response
    bio: candidate.bio,
    work_study: candidate.work_study,
    phone: undefined,
    role: "user",
    status: "active",
    last_active: candidate.last_active,
    photos: candidate.photos,
    prompts: candidate.prompts,
    interests: candidate.interests,
    location: candidate.city
      ? {
          city: candidate.city,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }
      : null,
  };
}
