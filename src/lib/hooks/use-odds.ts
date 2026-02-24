"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";

async function fetchOdds(sport?: string) {
  const url = sport ? `/api/odds?sport=${sport}` : "/api/odds";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch odds: ${res.status}`);
  return res.json();
}

async function fetchEventOdds(eventId: string) {
  const res = await fetch(`/api/odds/${eventId}`);
  if (!res.ok) throw new Error(`Failed to fetch odds for event ${eventId}: ${res.status}`);
  return res.json();
}

export function useOdds(sport?: string) {
  return useQuery<ConsolidatedOddsEvent[]>({
    queryKey: ["odds", { sport }],
    queryFn: () => fetchOdds(sport),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useEventOdds(eventId: string) {
  return useQuery<ConsolidatedOddsEvent>({
    queryKey: ["odds", eventId],
    queryFn: () => fetchEventOdds(eventId),
    staleTime: 5_000,
    refetchInterval: 15_000,
    enabled: !!eventId,
  });
}
