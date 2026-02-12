"use client";

import { useState } from "react";
import { Heart, MessageCircleHeart, Search } from "lucide-react";
import { MatchListItem } from "@/components/match/match-list-item";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { MOCK_MATCHES } from "@/lib/mock-data";
import type { Match } from "@/lib/types";

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = MOCK_MATCHES.filter((m) =>
    m.user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by most recent match first
  const sortedMatches = [...filteredMatches].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircleHeart
            size={22}
            className="text-primary"
            aria-hidden="true"
          />
          <h1 className="font-display text-xl font-bold">Matches</h1>
          {MOCK_MATCHES.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
              {MOCK_MATCHES.length}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      {MOCK_MATCHES.length > 2 && (
        <div className="px-4 mb-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar match..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-muted/50 border border-border/50 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
              aria-label="Buscar matches"
            />
          </div>
        </div>
      )}

      {/* New matches (without messages yet) */}
      {sortedMatches.some((m) => !m.last_message_at) && (
        <div className="px-4 mb-5">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Heart size={14} className="text-primary" aria-hidden="true" />
            Nuevos matches
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {sortedMatches
              .filter((m) => !m.last_message_at)
              .map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => setSelectedMatch(match)}
                  className="flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1"
                  aria-label={`Ver perfil de ${match.user.display_name}`}
                >
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary shadow-md transition-transform hover:scale-105 active:scale-95">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={match.user.photos[0]?.url}
                      alt={match.user.display_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      width={64}
                      height={64}
                    />
                  </div>
                  <span className="text-xs font-medium truncate max-w-[72px]">
                    {match.user.display_name}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* All matches list */}
      <div className="px-4">
        <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Todos los matches
        </h2>

        {sortedMatches.length > 0 ? (
          <div className="space-y-2">
            {sortedMatches.map((match, i) => (
              <MatchListItem
                key={match.id}
                match={match}
                index={i}
                onViewProfile={() => setSelectedMatch(match)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <MessageCircleHeart
                size={28}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <h3 className="font-display font-semibold text-lg mb-1">
              {searchQuery ? "Sin resultados" : "Aún no tienes matches"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {searchQuery
                ? "Intenta con otro nombre"
                : "Sigue haciendo swipe para encontrar a tu persona ideal"}
            </p>
          </div>
        )}
      </div>

      {/* Profile modal */}
      {selectedMatch && (
        <FullSwipeCard
          profile={selectedMatch.user}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
