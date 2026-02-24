"use client";

import { useQuery } from "@tanstack/react-query";

export function useProps(eventId: string) {
  return useQuery({
    queryKey: ["props", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/props/${eventId}`);
      if (!res.ok) throw new Error(`Failed to fetch props for event ${eventId}: ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!eventId,
  });
}
