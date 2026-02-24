"use client";

import { useQuery } from "@tanstack/react-query";
import type { ValueBet } from "@/src/lib/odds-api/types";

export function useValueBets() {
  return useQuery<ValueBet[]>({
    queryKey: ["valueBets"],
    queryFn: async () => {
      const res = await fetch("/api/value-bets");
      if (!res.ok) throw new Error(`Failed to fetch value bets: ${res.status}`);
      return res.json();
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
