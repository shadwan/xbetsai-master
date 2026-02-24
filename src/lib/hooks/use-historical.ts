"use client";

import { useQuery } from "@tanstack/react-query";
import type { HistoricalEventOdds } from "@/src/lib/odds-api/types";

export function useHistorical(eventId: string) {
  return useQuery<HistoricalEventOdds>({
    queryKey: ["historical", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/historical/${eventId}`);
      if (!res.ok) throw new Error(`Failed to fetch historical odds for event ${eventId}: ${res.status}`);
      return res.json();
    },
    staleTime: 300_000,
    refetchInterval: false,
    enabled: !!eventId,
  });
}
