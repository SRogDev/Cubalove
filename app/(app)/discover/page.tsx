"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { SwipeStack } from "@/components/swipe/swipe-stack";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { MatchScreen } from "@/components/match/match-screen";
import { SectionSwitch } from "@/components/discover/section-switch";
import { RecommendationsList, RecommendationsListSkeleton } from "@/components/discover/recommendations-list";
import { IdealPartnerModal } from "@/components/discover/ideal-partner-modal";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { createSwipe } from "@/app/actions/swipes";
import type { UserProfile, DiscoveryResponse, RecommendationsResponse } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("fetch failed");
    return r.json();
  });

/** localStorage key: user has been shown the modal at least once */
const IDEAL_MODAL_SEEN_KEY = "cubalove_ideal_seen_v1";

export default function DiscoverPage() {
  const { latitude, longitude } = useGeolocation();
  const { limits, stats, mutate: mutateSubscription } = useSubscription();
  const [section, setSection] = useState<"buscar" | "recomendado">("buscar");
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [showIdealModal, setShowIdealModal] = useState(false);
  // Track if user has a description (optimistic update after modal save)
  const [localHasDescription, setLocalHasDescription] = useState<boolean | null>(null);
  // Only start fetching recommendations after first tab switch
  const recFetchEnabled = useRef(false);

  // ── Discovery SWR ──────────────────────────────────────────────────────
  const discoveryParams = new URLSearchParams();
  if (latitude) discoveryParams.set("lat", String(latitude));
  if (longitude) discoveryParams.set("lng", String(longitude));

  const { data: discoveryData, isLoading: discoveryLoading } = useSWR<DiscoveryResponse>(
    `/api/discovery?${discoveryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  // ── Recommendations SWR (lazy — only fetches once tab is visited) ──────
  const { data: recsData, isLoading: recsLoading, mutate: mutateRecs } =
    useSWR<RecommendationsResponse>(
      recFetchEnabled.current ? "/api/recommendations" : null,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 60000 * 60 },
    );

  const hasDescription =
    localHasDescription ?? recsData?.has_ideal_description ?? false;

  // ── Section switch with auto-open modal ────────────────────────────────
  const handleSectionChange = (val: "buscar" | "recomendado") => {
    if (val === "recomendado") {
      recFetchEnabled.current = true;
      // Open modal if user has never seen it (first visit to this tab)
      if (typeof window !== "undefined" && !localStorage.getItem(IDEAL_MODAL_SEEN_KEY)) {
        setShowIdealModal(true);
      }
    }
    setSection(val);
  };

  const handleModalClose = (saved: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(IDEAL_MODAL_SEEN_KEY, "1");
    }
    setShowIdealModal(false);
    if (saved) {
      // Optimistically mark as having a description, then refetch recs
      setLocalHasDescription(true);
      mutateRecs?.();
    }
  };

  // ── Swipe handler ──────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (profile: UserProfile, direction: "like" | "nope" | "superlike") => {
      if (direction === "superlike" && stats) {
        if (stats.superlikes_today >= limits.superlikesPerDay) return;
      }
      if (direction === "like" && stats) {
        if (limits.likesPerPeriod !== Infinity && stats.swipes_today >= limits.likesPerPeriod) return;
      }

      const result = await createSwipe({ targetId: profile.user_id, type: direction });

      if (result.success) {
        mutateSubscription();
        if (result.matched) {
          setTimeout(() => setMatchedProfile(profile), 400);
        }
      }
    },
    [limits, stats, mutateSubscription],
  );

  const profiles = discoveryData?.profiles ?? [];
  const recommendations = recsData?.recommendations ?? [];

  return (
    <div className="h-[calc(100svh-var(--top-bar-height)-var(--bottom-nav-height))] flex flex-col">
      {/* ── Top toggle ── */}
      <SectionSwitch value={section} onChange={handleSectionChange} />

      {/* ── Buscar section ──────────────────────────────────────────────── */}
      <div className={section !== "buscar" ? "hidden" : "flex flex-col flex-1 min-h-0"}>
        {discoveryLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="font-display text-xl font-bold mb-2">No hay más perfiles</h2>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              Vuelve más tarde o ajusta tus filtros para descubrir más personas.
            </p>
          </div>
        ) : (
          <SwipeStack
            profiles={profiles}
            userLat={latitude}
            userLng={longitude}
            canRewind={limits.canRewind}
            onSwipe={handleSwipe}
            onViewProfile={setViewingProfile}
          />
        )}
      </div>

      {/* ── Recomendado section ──────────────────────────────────────────── */}
      <div className={section !== "recomendado" ? "hidden" : "flex flex-col flex-1 min-h-0 overflow-y-auto"}>
        {recsLoading ? (
          <RecommendationsListSkeleton />
        ) : (
          <RecommendationsList
            profiles={recommendations}
            hasDescription={hasDescription}
            onRequestDescription={() => setShowIdealModal(true)}
          />
        )}
      </div>

      {/* ── Ideal partner modal (controlled) ─────────────────────────────── */}
      <IdealPartnerModal
        open={showIdealModal}
        onClose={handleModalClose}
        isFirstTime={!hasDescription}
      />

      {/* ── Shared modals ─────────────────────────────────────────────────── */}
      {viewingProfile && (
        <FullSwipeCard
          profile={viewingProfile}
          open={!!viewingProfile}
          onClose={() => setViewingProfile(null)}
          onLike={() => { handleSwipe(viewingProfile, "like"); setViewingProfile(null); }}
          onSuperlike={() => { handleSwipe(viewingProfile, "superlike"); setViewingProfile(null); }}
        />
      )}

      {matchedProfile && (
        <MatchScreen
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      )}
    </div>
  );
}
