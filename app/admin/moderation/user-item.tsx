"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { suspendUser, blockUser, reactivateUser } from "../actions";
import { getAge } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

interface ModerationUserItemProps {
  user: UserProfile;
  reportCount: number;
}

export const ModerationUserItem = ({
  user,
  reportCount,
}: ModerationUserItemProps) => {
  const [viewProfile, setViewProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(user.status);
  const age = getAge(user.date_of_birth);

  const handleAction = async (
    action: "suspend" | "block" | "reactivate"
  ) => {
    setLoading(true);
    setActionMessage(null);

    let result;
    if (action === "suspend") {
      result = await suspendUser(user.user_id);
      if (result.success) setCurrentStatus("suspended");
    } else if (action === "block") {
      result = await blockUser(user.user_id);
      if (result.success) setCurrentStatus("blocked");
    } else {
      result = await reactivateUser(user.user_id);
      if (result.success) setCurrentStatus("active");
    }

    setActionMessage(result.message || result.error || null);
    setLoading(false);
  };

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => setViewProfile(true)}
            className="relative shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 border-border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Ver perfil de ${user.display_name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.photos[0]?.url}
              alt={user.display_name}
              className="h-full w-full object-cover"
              width={48}
              height={48}
            />
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm truncate">
                {user.display_name}, {age}
              </span>

              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  currentStatus === "active" && "bg-success/10 text-success",
                  currentStatus === "suspended" &&
                    "bg-warning/10 text-warning",
                  currentStatus === "blocked" &&
                    "bg-destructive/10 text-destructive"
                )}
              >
                {currentStatus === "active" && "Activo"}
                {currentStatus === "suspended" && "Suspendido"}
                {currentStatus === "blocked" && "Bloqueado"}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              {user.location && (
                <span className="text-xs text-muted-foreground truncate">
                  {user.location.city}
                </span>
              )}
              {reportCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                  <AlertTriangle size={12} />
                  {reportCount} reportes
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewProfile(true)}
              className="h-8 w-8 p-0 rounded-lg"
              aria-label="Ver perfil"
            >
              <Eye size={16} />
            </Button>

            {currentStatus === "active" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction("suspend")}
                  disabled={loading}
                  className="h-8 px-2 rounded-lg text-warning hover:text-warning hover:bg-warning/10 text-xs"
                  aria-label="Suspender 3 días"
                >
                  <Clock size={14} className="mr-1" />
                  3d
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction("block")}
                  disabled={loading}
                  className="h-8 px-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  aria-label="Bloquear permanente"
                >
                  <Ban size={14} className="mr-1" />
                  Ban
                </Button>
              </>
            )}

            {(currentStatus === "suspended" ||
              currentStatus === "blocked") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("reactivate")}
                disabled={loading}
                className="h-8 px-2 rounded-lg text-success hover:text-success hover:bg-success/10 text-xs"
                aria-label="Reactivar usuario"
              >
                <RotateCcw size={14} className="mr-1" />
                Reactivar
              </Button>
            )}
          </div>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <p className="text-xs text-muted-foreground mt-2 pl-15">
            {actionMessage}
          </p>
        )}
      </div>

      {/* Profile modal */}
      {viewProfile && (
        <FullSwipeCard
          profile={user}
          open={viewProfile}
          onClose={() => setViewProfile(false)}
        />
      )}
    </>
  );
};
