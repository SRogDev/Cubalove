"use client";

import { useState, useCallback } from "react";
import { SwipeStack } from "@/components/swipe/swipe-stack";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { MatchScreen } from "@/components/match/match-screen";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { MOCK_PROFILES } from "@/lib/mock-data";
import type { UserProfile } from "@/lib/types";

export default function DiscoverPage() {
  const { latitude, longitude } = useGeolocation();
  const { limits, stats } = useSubscription();
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);

  const handleSwipe = useCallback(
    (profile: UserProfile, direction: "like" | "nope" | "superlike") => {
      // Check superlike limit
      if (direction === "superlike" && stats) {
        if (stats.superlikes_today >= limits.superlikesPerDay) {
          return;
        }
      }
      // Check like limit (VIP = Infinity, so this never blocks)
      if (direction === "like" && stats) {
        if (
          limits.likesPerPeriod !== Infinity &&
          stats.swipes_today >= limits.likesPerPeriod
        ) {
          return;
        }
      }

      // Simular match aleatorio al dar like/superlike (mock)
      if (direction !== "nope" && Math.random() > 0.6) {
        setTimeout(() => setMatchedProfile(profile), 400);
      }
    },
    [limits, stats],
  );

  return (
    <div className="h-[calc(100svh-var(--top-bar-height)-var(--bottom-nav-height))] flex flex-col">
      <SwipeStack
        profiles={MOCK_PROFILES}
        userLat={latitude}
        userLng={longitude}
        canRewind={limits.canRewind}
        onSwipe={handleSwipe}
        onViewProfile={setViewingProfile}
      />

      {/* Full Swipe Card modal */}
      {viewingProfile && (
        <FullSwipeCard
          profile={viewingProfile}
          open={!!viewingProfile}
          onClose={() => setViewingProfile(null)}
          onLike={() => {
            handleSwipe(viewingProfile, "like");
            setViewingProfile(null);
          }}
          onSuperlike={() => {
            handleSwipe(viewingProfile, "superlike");
            setViewingProfile(null);
          }}
        />
      )}

      {/* Match screen */}
      {matchedProfile && (
        <MatchScreen
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      )}
    </div>
  );
}
