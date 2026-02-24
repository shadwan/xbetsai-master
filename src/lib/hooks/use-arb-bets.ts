"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArbitrageBet } from "@/src/lib/odds-api/types";
import { normalizeArbBet } from "@/src/lib/utils/odds";

export function useArbBets() {
  return useQuery<ArbitrageBet[]>({
    queryKey: ["arbBets"],
    queryFn: async () => {
      const res = await fetch("/api/arb-bets");
      if (!res.ok) throw new Error(`Failed to fetch arb bets: ${res.status}`);
      const raw: Record<string, unknown>[] = await res.json();
      return raw.map(normalizeArbBet) as ArbitrageBet[];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
