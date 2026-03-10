"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Briefcase,
  MessageSquareQuote,
  Sparkles,
  Flag,
  Crown,
} from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { getAge } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/profile/report-dialog";

interface FullSwipeCardProps {
  profile: UserProfile;
  open: boolean;
  onClose: () => void;
  onLike?: () => void;
  onSuperlike?: () => void;
  isVip?: boolean;
}

export const FullSwipeCard = ({
  profile,
  open,
  onClose,
  onLike,
  onSuperlike,
  isVip,
}: FullSwipeCardProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const age = getAge(profile.date_of_birth);
  const photos = profile.photos;

  const handlePhotoTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;

    if (x > half) {
      setPhotoIndex((prev) => Math.min(prev + 1, photos.length - 1));
    } else {
      setPhotoIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-background overflow-y-auto overscroll-contain"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* Header con botón volver y acción rápida */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md safe-top">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Volver"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Reportar usuario"
              >
                <Flag size={16} aria-hidden="true" />
              </button>

              {onLike && (
                <button
                  type="button"
                  onClick={() => {
                    onLike();
                    onClose();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white shadow-md shadow-primary/20 transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Like"
                >
                  <Heart size={18} fill="currentColor" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Galería de fotos */}
          <div className="relative">
            <div
              className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-muted"
              onClick={handlePhotoTap}
              role="button"
              tabIndex={0}
              aria-label={`Foto ${photoIndex + 1} de ${photos.length}`}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight")
                  setPhotoIndex((p) => Math.min(p + 1, photos.length - 1));
                if (e.key === "ArrowLeft")
                  setPhotoIndex((p) => Math.max(p - 1, 0));
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[photoIndex]?.url}
                alt={`${profile.display_name}, foto ${photoIndex + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
                width={600}
                height={800}
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
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i === photoIndex ? "bg-white" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contenido del perfil */}
          <div className="px-5 pb-36">
            {/* Nombre, edad, ubicación */}
            <div className="pt-5 pb-4 border-b border-border/50">
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-3xl font-bold">
                  {profile.display_name}
                </h1>
                <span className="text-2xl font-light text-muted-foreground">
                  {age}
                </span>
                {isVip && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    <Crown size={12} />
                    VIP
                  </span>
                )}
              </div>

              {profile.location && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{profile.location.city}</span>
                </div>
              )}

              {profile.work_study && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Briefcase size={15} aria-hidden="true" />
                  <span>{profile.work_study}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="py-4 border-b border-border/50">
                <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sobre mí
                </h2>
                <p className="text-[15px] leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Prompts */}
            {profile.prompts.length > 0 && (
              <div className="py-4 border-b border-border/50">
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquareQuote
                    size={16}
                    className="text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Prompts
                  </h2>
                </div>
                <div className="space-y-3">
                  {profile.prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="rounded-2xl bg-muted/50 p-4"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {prompt.prompt_text}
                      </p>
                      <p className="text-[15px] font-medium">
                        &ldquo;{prompt.answer_text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intereses */}
            {profile.interests.length > 0 && (
              <div className="py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles
                    size={16}
                    className="text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Intereses
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción fijos abajo */}
          {(onLike || onSuperlike) && (
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-md border-t border-border/30 safe-bottom">
              <div className="flex items-center justify-center gap-5 py-4 px-6">
                {onSuperlike && (
                  <button
                    type="button"
                    onClick={() => {
                      onSuperlike();
                      onClose();
                    }}
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-info/30 bg-background text-info shadow-lg transition-all hover:bg-info/10 hover:scale-110 active:scale-95 touch-action-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Super Like"
                  >
                    <Star size={24} fill="currentColor" aria-hidden="true" />
                  </button>
                )}

                {onLike && (
                  <button
                    type="button"
                    onClick={() => {
                      onLike();
                      onClose();
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95 touch-action-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Like"
                  >
                    <Heart size={28} fill="currentColor" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Report dialog */}
      <ReportDialog
        targetUserId={profile.user_id}
        targetName={profile.display_name}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </AnimatePresence>
  );
};
