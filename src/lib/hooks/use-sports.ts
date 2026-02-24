"use client";

import { useQuery } from "@tanstack/react-query";
import type { Sport } from "@/src/lib/odds-api/types";

export function useSports() {
  return useQuery<Sport[]>({
    queryKey: ["sports"],
    queryFn: async () => {
      const res = await fetch("/api/sports");
      if (!res.ok) throw new Error(`Failed to fetch sports: ${res.status}`);
      return res.json();
    },
    staleTime: 3_600_000,
    refetchInterval: false,
  });
}
