"use client";

import { useQuery } from "@tanstack/react-query";
import type { EventOddsMovement } from "@/src/lib/realtime/poller";

export function useHistorical(eventId: string) {
  return useQuery<EventOddsMovement>({
    queryKey: ["historical", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/historical/${eventId}`);
      if (!res.ok) throw new Error(`Failed to fetch odds movement for event ${eventId}: ${res.status}`);
      return res.json();
    },
    staleTime: 600_000,
    refetchInterval: false,
    enabled: !!eventId,
  });
}
