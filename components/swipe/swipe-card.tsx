"use client";

import { useState } from "react";
import { MapPin, Briefcase, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";
import { getAge } from "@/lib/utils";
import { formatDistanceLabel } from "@/lib/hooks/use-geolocation";

interface SwipeCardProps {
  profile: UserProfile;
  distanceKm?: number | null;
  isVip?: boolean;
  onTapProfile: () => void;
}

export const SwipeCard = ({ profile, distanceKm, isVip, onTapProfile }: SwipeCardProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const age = getAge(profile.date_of_birth);
  const photos = profile.photos;

  const handlePhotoTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const half = rect.width / 2;

    if (x > half) {
      setPhotoIndex((prev) => Math.min(prev + 1, photos.length - 1));
    } else {
      setPhotoIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-muted shadow-xl select-none",
        isVip && "ring-2 ring-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.3)]",
      )}
      style={{ touchAction: "none" }}
    >
      {/* Photo */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handlePhotoTap}
        role="button"
        tabIndex={0}
        aria-label={`Foto ${photoIndex + 1} de ${photos.length} de ${profile.display_name}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setPhotoIndex((p) => Math.min(p + 1, photos.length - 1));
          if (e.key === "ArrowLeft") setPhotoIndex((p) => Math.max(p - 1, 0));
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[photoIndex]?.url}
          alt={`${profile.display_name}, ${age} años`}
          className="h-full w-full object-cover"
          draggable={false}
          width={600}
          height={900}
        />
      </div>

      {/* Photo indicators */}
      {photos.length > 1 && (
        <div
          className="absolute top-3 left-3 right-3 flex gap-1"
          aria-hidden="true"
        >
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/40"
                }`}
            />
          ))}
        </div>
      )}

      {/* VIP badge */}
      {isVip && (
        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
          <Crown size={12} />
          VIP
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 card-gradient pointer-events-none" />

      {/* Profile info */}
      <button
        type="button"
        className="absolute bottom-0 left-0 right-0 p-4 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={(e) => {
          e.stopPropagation();
          onTapProfile();
        }}
        aria-label={`Ver perfil completo de ${profile.display_name}`}
      >
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-2xl font-bold truncate">
            {profile.display_name}
          </h2>
          <span className="text-xl font-light">{age}</span>
        </div>

        {(profile.location || distanceKm != null) && (
          <div className="flex items-center gap-1 mt-1 text-sm text-white/80">
            <MapPin size={14} aria-hidden="true" />
            <span className="truncate">
              {distanceKm != null
                ? `${formatDistanceLabel(distanceKm)}${profile.location ? ` · ${profile.location.city}` : ""}`
                : profile.location?.city}
            </span>
          </div>
        )}

        {profile.work_study && (
          <div className="flex items-center gap-1 mt-0.5 text-sm text-white/70">
            <Briefcase size={14} aria-hidden="true" />
            <span className="truncate">{profile.work_study}</span>
          </div>
        )}

        {profile.bio && (
          <p className="mt-2 text-sm text-white/80 line-clamp-1">
            {profile.prompts[0]
              ? `"${profile.prompts[0].answer_text}"`
              : profile.bio}
          </p>
        )}
      </button>
    </div>
  );
};
