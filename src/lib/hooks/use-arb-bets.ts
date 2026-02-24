"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArbitrageBet } from "@/src/lib/odds-api/types";

export function useArbBets() {
  return useQuery<ArbitrageBet[]>({
    queryKey: ["arbBets"],
    queryFn: async () => {
      const res = await fetch("/api/arb-bets");
      if (!res.ok) throw new Error(`Failed to fetch arb bets: ${res.status}`);
      return res.json();
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
