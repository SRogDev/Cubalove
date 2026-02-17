"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { COUPLE_CHALLENGES } from "@/lib/constants/couple-challenges";

interface DailyChallengeProps {
  roomId: string;
}

/**
 * Shows a deterministic daily challenge based on the current date + room ID.
 * Same challenge for both partners on the same day.
 */
export function DailyChallenge({ roomId }: DailyChallengeProps) {
  const challenge = useMemo(() => {
    // Deterministic seed from date + roomId
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    // Simple hash of roomId
    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
      hash = (hash << 5) - hash + roomId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs((dayOfYear + hash) % COUPLE_CHALLENGES.length);
    return COUPLE_CHALLENGES[index];
  }, [roomId]);

  const categoryLabels: Record<string, string> = {
    comunicacion: "Comunicación",
    aventura: "Aventura",
    romantico: "Romántico",
    divertido: "Divertido",
    intimo: "Íntimo",
    creatividad: "Creatividad",
    crecimiento: "Crecimiento",
  };

  const categoryColors: Record<string, string> = {
    comunicacion: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    aventura: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    romantico: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    divertido: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    intimo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    creatividad: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    crecimiento: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/5 to-pink-100/50 dark:from-primary/10 dark:to-pink-950/20 border border-primary/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-primary">
          Reto del Día
        </h3>
      </div>

      <div className="flex items-start gap-3">
        <span className="text-3xl">{challenge.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed mb-2">
            {challenge.challenge}
          </p>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              categoryColors[challenge.category] || "bg-gray-100 text-gray-700"
            }`}
          >
            {categoryLabels[challenge.category] || challenge.category}
          </span>
        </div>
      </div>
    </div>
  );
}
