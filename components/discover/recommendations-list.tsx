"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SwipeCard } from "@/components/swipe/swipe-card";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { createSwipe } from "@/app/actions/swipes";
import type { RecommendedProfile } from "@/lib/types";

interface RecommendationsListProps {
  profiles: RecommendedProfile[];
  /** Whether the user has already saved an ideal partner description */
  hasDescription: boolean;
  /** Called when user taps the CTA to open the ideal partner modal */
  onRequestDescription: () => void;
}

export function RecommendationsList({
  profiles: initialProfiles,
  hasDescription,
  onRequestDescription,
}: RecommendationsListProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [viewing, setViewing] = useState<RecommendedProfile | null>(null);

  const handleAction = async (
    profile: RecommendedProfile,
    type: "like" | "superlike",
  ) => {
    setProfiles((prev) => prev.filter((p) => p.user_id !== profile.user_id));
    setViewing(null);
    await createSwipe({ targetId: profile.user_id, type });
  };

  // ── Blocked: no description written yet ─────────────────────────────────
  if (!hasDescription) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-16 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles size={32} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold mb-2">
            Activa tus recomendaciones
          </h2>
          <p className="text-sm text-muted-foreground max-w-[270px] leading-relaxed">
            Para encontrar compatibilidades reales necesitamos que nos cuentes
            cómo es la persona que buscas. Sin eso el algoritmo no puede
            trabajar.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestDescription}
          className="px-8 h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-transform"
        >
          Describir mi persona ideal
        </button>
      </div>
    );
  }

  // ── Empty: has description but no recs this week ─────────────────────────
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-16">
        <p className="text-5xl mb-4">✨</p>
        <h2 className="font-display text-lg font-bold mb-2">
          Sin recomendaciones activas
        </h2>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Cada semana calculamos tus 5 mejores compatibilidades.
          Vuelve el próximo lunes.
        </p>
      </div>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-3 overflow-y-auto">
        <p className="text-xs text-muted-foreground text-center font-medium tracking-wide uppercase">
          Tus {profiles.length} recomendados esta semana
        </p>

        {profiles.map((profile) => (
          <div
            key={profile.user_id}
            className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setViewing(profile)}
          >
            <SwipeCard
              profile={profile}
              isVip={false}
              onTapProfile={() => setViewing(profile)}
            />
          </div>
        ))}
      </div>

      {viewing && (
        <FullSwipeCard
          profile={viewing}
          open={!!viewing}
          onClose={() => setViewing(null)}
          onLike={() => handleAction(viewing, "like")}
          onSuperlike={() => handleAction(viewing, "superlike")}
        />
      )}
    </>
  );
}

/** Skeleton loader — shown while fetching recommendations */
export function RecommendationsListSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <div className="h-4 w-48 bg-muted rounded-full mx-auto animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-sm mx-auto rounded-2xl bg-muted animate-pulse"
          style={{ aspectRatio: "2/3" }}
        />
      ))}
    </div>
  );
}
