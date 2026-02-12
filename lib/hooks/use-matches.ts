"use client";

import useSWR from "swr";
import type { Match } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch matches");
    return r.json();
  });

export function useMatches() {
  const { data, error, isLoading, mutate } = useSWR<{ matches: Match[] }>(
    "/api/matches",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  return {
    matches: data?.matches ?? [],
    isLoading,
    error,
    mutate,
  };
}
