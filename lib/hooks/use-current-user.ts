"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
    fetch(url).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch user");
        return r.json();
    });

/**
 * Returns the current user's ID from the session.
 */
export function useCurrentUser() {
    const { data, error, isLoading } = useSWR<{ userId: string }>(
        "/api/me",
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 120000 },
    );

    return {
        userId: data?.userId ?? null,
        isLoading,
        error,
    };
}
