"use client";

import { useState } from "react";
import {
  Heart,
  Eye,
  Share2,
  TrendingUp,
  Lightbulb,
  Trophy,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Chisme } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ChismeCardProps {
  chisme: Chisme;
  index: number;
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Heart; label: string; accent: string; bg: string }
> = {
  stat: {
    icon: BarChart3,
    label: "Dato",
    accent: "text-info",
    bg: "bg-info/10",
  },
  tip: {
    icon: Lightbulb,
    label: "Consejo",
    accent: "text-gold",
    bg: "bg-gold/10",
  },
  milestone: {
    icon: TrendingUp,
    label: "Logro",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  success: {
    icon: Trophy,
    label: "Historia",
    accent: "text-success",
    bg: "bg-success/10",
  },
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

export const ChismeCard = ({ chisme, index }: ChismeCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(chisme.likes);
  const config = TYPE_CONFIG[chisme.content.type || "stat"] ?? TYPE_CONFIG.stat;
  const TypeIcon = config.icon;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    const shareData = {
      title: "Empatando",
      text: chisme.content.text,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(chisme.content.text);
    }
  };

  return (
    <motion.article
      className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
    >
      {/* Image (if present) */}
      {chisme.image_url && (
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chisme.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            width={600}
            height={400}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Type badge + timestamp */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              config.bg,
              config.accent
            )}
          >
            <TypeIcon size={12} aria-hidden="true" />
            {config.label}
          </div>
          <time className="text-xs text-muted-foreground">
            {formatTimeAgo(chisme.created_at)}
          </time>
        </div>

        {/* Text content */}
        <p className="text-[15px] leading-relaxed font-medium mb-4">
          {chisme.content.text}
        </p>

        {/* Footer: stats + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-center gap-4">
            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1",
                liked
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-label={liked ? "Quitar like" : "Dar like"}
              aria-pressed={liked}
            >
              <Heart
                size={16}
                fill={liked ? "currentColor" : "none"}
                aria-hidden="true"
                className={cn(liked && "animate-match-pop")}
              />
              <span>{formatCount(likeCount)}</span>
            </button>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye size={16} aria-hidden="true" />
              <span>{formatCount(chisme.views)}</span>
            </div>
          </div>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
            aria-label="Compartir"
          >
            <Share2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};
