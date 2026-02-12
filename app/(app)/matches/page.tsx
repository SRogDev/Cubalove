"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircleHeart,
  Search,
  Eye,
  Lock,
  Crown,
} from "lucide-react";
import { MatchListItem } from "@/components/match/match-list-item";
import { FullSwipeCard } from "@/components/swipe/full-swipe-card";
import { useMatches } from "@/lib/hooks/use-matches";
import { useReceivedLikes } from "@/lib/hooks/use-received-likes";
import { MOCK_MATCHES, getAge } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

const TABS = [
  { id: "matches", label: "Matches", icon: MessageCircleHeart },
  { id: "likes", label: "Likes", icon: Heart },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("matches");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // SWR hooks — fall back to mock data while real DB isn't connected
  const { matches: apiMatches, isLoading: matchesLoading } = useMatches();
  const { likes, requiresUpgrade, isLoading: likesLoading } = useReceivedLikes();

  const matches = apiMatches.length > 0 ? apiMatches : MOCK_MATCHES;

  const filteredMatches = matches.filter((m) =>
    m.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedMatches = [...filteredMatches].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
          {matches.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
              {matches.length}
            </span>
          )}
        </div>
      </div>

      {/* Tabs — Matches | Likes */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === "likes" && likes.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-bold text-primary">
                    {likes.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* === MATCHES TAB === */}
      {activeTab === "matches" ? (
        <>
          {/* Search */}
          {matches.length > 2 && (
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

          {/* New matches (without messages) */}
          {sortedMatches.some((m) => !m.last_message_at) && (
            <div className="px-4 mb-5">
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Heart
                  size={14}
                  className="text-primary"
                  aria-hidden="true"
                />
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

            {matchesLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : sortedMatches.length > 0 ? (
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
        </>
      ) : (
        /* === LIKES YOU TAB === */
        <div className="px-4">
          {requiresUpgrade ? (
            /* Upgrade prompt for free users */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 mb-4">
                <Lock size={32} className="text-yellow-500" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                Descubre quién te dio like
              </h3>
              <p className="text-sm text-muted-foreground max-w-[260px] mb-4">
                Mejora a Plus o VIP para ver quién se interesó en ti
              </p>
              <a
                href="/premium"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                <Crown size={16} />
                Mejorar plan
              </a>
            </div>
          ) : likesLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : likes.length > 0 ? (
            /* Grid of people who liked you */
            <>
              <p className="text-sm text-muted-foreground mb-4">
                <Eye size={14} className="inline mr-1" />
                {likes.length} persona{likes.length > 1 ? "s" : ""} te{" "}
                {likes.length > 1 ? "dieron" : "dio"} like
              </p>
              <div className="grid grid-cols-2 gap-3">
                {likes.map((like) => (
                  <div
                    key={like.user_id}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={like.photos[0]?.url}
                      alt={like.display_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      width={300}
                      height={400}
                    />
                    <div className="absolute inset-0 card-gradient pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-lg font-bold truncate">
                          {like.display_name}
                        </span>
                        <span className="text-base font-light">
                          {getAge(like.date_of_birth)}
                        </span>
                      </div>
                      {like.swipe_type === "superlike" && (
                        <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-info/80 px-2 py-0.5 text-xs font-semibold">
                          Super Like
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Heart
                  size={28}
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">
                Aún nadie te ha dado like
              </h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                Mejora tu perfil con más fotos para recibir más likes
              </p>
            </div>
          )}
        </div>
      )}

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
