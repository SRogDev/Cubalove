"use client";

import useSWR from "swr";
import type { UserStats } from "@/lib/types";
import { getPlanLimits, type PlanKey } from "@/lib/constants/subscription";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch subscription");
    return r.json();
  });

export function useSubscription() {
  const { data, error, isLoading, mutate } = useSWR<{
    plan: string;
    stats: UserStats | null;
  }>("/api/me/subscription", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const plan = (data?.plan || "free") as PlanKey;
  const limits = getPlanLimits(plan);

  return {
    plan,
    limits,
    stats: data?.stats ?? null,
    isLoading,
    error,
    mutate,
  };
}
