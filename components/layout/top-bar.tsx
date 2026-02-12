"use client";

import { Diamond, Bell } from "lucide-react";
import Link from "next/link";

export const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-md safe-top">
      <div className="mx-auto flex h-[var(--top-bar-height)] max-w-lg items-center justify-between px-4">
        <Link
          href="/discover"
          className="font-display text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          Dating Cuba
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/premium"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Premium"
          >
            <Diamond size={20} strokeWidth={2} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Notificaciones"
          >
            <Bell size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
