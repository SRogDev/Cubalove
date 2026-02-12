"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { UserProfile } from "@/lib/types";
import { SwipeCard } from "./swipe-card";
import { SwipeActions } from "./swipe-actions";
import { calculateDistance } from "@/lib/services/discovery";

interface SwipeStackProps {
  profiles: UserProfile[];
  userLat?: number | null;
  userLng?: number | null;
  onSwipe: (profile: UserProfile, direction: "like" | "nope" | "superlike") => void;
  onViewProfile: (profile: UserProfile) => void;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = -80;

export const SwipeStack = ({ profiles, userLat, userLng, onSwipe, onViewProfile }: SwipeStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  const [lastSwiped, setLastSwiped] = useState<number | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const superlikeOpacity = useTransform(y, [SWIPE_UP_THRESHOLD, 0], [1, 0]);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const getDistance = (profile: UserProfile): number | null => {
    if (
      userLat == null ||
      userLng == null ||
      !profile.location?.latitude ||
      !profile.location?.longitude
    )
      return null;
    return calculateDistance(
      userLat,
      userLng,
      profile.location.latitude,
      profile.location.longitude
    );
  };

  const handleSwipe = useCallback(
    (direction: "like" | "nope" | "superlike") => {
      if (!currentProfile) return;
      setLastSwiped(currentIndex);
      setExitDirection(
        direction === "like" ? "right" : direction === "nope" ? "left" : "up"
      );

      setTimeout(() => {
        onSwipe(currentProfile, direction);
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
        x.set(0);
        y.set(0);
      }, 300);
    },
    [currentProfile, currentIndex, onSwipe, x, y]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;

    if (offset.y < SWIPE_UP_THRESHOLD && Math.abs(offset.x) < 60) {
      handleSwipe("superlike");
    } else if (offset.x > SWIPE_THRESHOLD) {
      handleSwipe("like");
    } else if (offset.x < -SWIPE_THRESHOLD) {
      handleSwipe("nope");
    }
  };

  const handleUndo = useCallback(() => {
    if (lastSwiped === null) return;
    setCurrentIndex(lastSwiped);
    setLastSwiped(null);
  }, [lastSwiped]);

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-3xl" role="img" aria-label="Sin perfiles">
            😴
          </span>
        </div>
        <h2 className="font-display text-xl font-bold mb-2">
          No hay más perfiles
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ya viste todos los perfiles disponibles. Vuelve más tarde para
          descubrir gente nueva.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 flex items-center justify-center px-4 py-2">
        {/* Next card (behind) */}
        {nextProfile && (
          <div className="absolute inset-x-4 top-2 bottom-0 flex items-center justify-center">
            <div className="w-full max-w-sm scale-[0.95] opacity-50">
              <SwipeCard
                profile={nextProfile}
                distanceKm={getDistance(nextProfile)}
                onTapProfile={() => {}}
              />
            </div>
          </div>
        )}

        {/* Current card */}
        <motion.div
          className="relative w-full max-w-sm z-10"
          style={{ x, y, rotate }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          animate={
            exitDirection === "left"
              ? { x: -400, opacity: 0, rotate: -30 }
              : exitDirection === "right"
                ? { x: 400, opacity: 0, rotate: 30 }
                : exitDirection === "up"
                  ? { y: -400, opacity: 0 }
                  : {}
          }
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          {/* Like overlay */}
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-4 border-success pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            <span className="font-display text-5xl font-extrabold text-success -rotate-12 border-4 border-success rounded-xl px-4 py-1">
              LIKE
            </span>
          </motion.div>

          {/* Nope overlay */}
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-4 border-destructive pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            <span className="font-display text-5xl font-extrabold text-destructive rotate-12 border-4 border-destructive rounded-xl px-4 py-1">
              NOPE
            </span>
          </motion.div>

          {/* Superlike overlay */}
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-4 border-info pointer-events-none"
            style={{ opacity: superlikeOpacity }}
          >
            <span className="font-display text-4xl font-extrabold text-info border-4 border-info rounded-xl px-4 py-1">
              SUPER LIKE
            </span>
          </motion.div>

          <SwipeCard
            profile={currentProfile}
            distanceKm={getDistance(currentProfile)}
            onTapProfile={() => onViewProfile(currentProfile)}
          />
        </motion.div>
      </div>

      <SwipeActions
        onLike={() => handleSwipe("like")}
        onNope={() => handleSwipe("nope")}
        onSuperlike={() => handleSwipe("superlike")}
        onUndo={handleUndo}
        canUndo={lastSwiped !== null}
      />
    </div>
  );
};
