"use client";

import { X, Star, Heart, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeActionsProps {
  onLike: () => void;
  onNope: () => void;
  onSuperlike: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const SwipeActions = ({
  onLike,
  onNope,
  onSuperlike,
  onUndo,
  canUndo = false,
}: SwipeActionsProps) => {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-md transition-all touch-action-manipulation",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            canUndo
              ? "border-gold/50 text-gold hover:bg-gold/10 hover:scale-110 active:scale-95"
              : "border-muted text-muted-foreground opacity-50 cursor-not-allowed"
          )}
          aria-label="Deshacer último swipe"
        >
          <Undo2 size={20} aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        onClick={onNope}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-background text-destructive shadow-lg transition-all hover:bg-destructive/10 hover:scale-110 active:scale-95 touch-action-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Pasar (No me gusta)"
      >
        <X size={28} strokeWidth={3} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onSuperlike}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-info/30 bg-background text-info shadow-lg transition-all hover:bg-info/10 hover:scale-110 active:scale-95 touch-action-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Super Like"
      >
        <Star size={24} fill="currentColor" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onLike}
        className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95 touch-action-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Like (Me gusta)"
      >
        <Heart size={28} fill="currentColor" aria-hidden="true" />
      </button>
    </div>
  );
};
