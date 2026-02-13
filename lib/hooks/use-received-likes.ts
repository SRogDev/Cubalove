"use client";

import useSWR from "swr";
import type { ReceivedLike } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (r.status === 403) return r.json();
    if (!r.ok) throw new Error("Failed to fetch received likes");
    return r.json();
  });

export function useReceivedLikes() {
  const { data, error, isLoading, mutate } = useSWR<{
    likes: ReceivedLike[];
    requiresUpgrade?: boolean;
  }>("/api/likes/received", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    likes: data?.likes ?? [],
    requiresUpgrade: data?.requiresUpgrade ?? false,
    isLoading,
    error,
    mutate,
  };
}
