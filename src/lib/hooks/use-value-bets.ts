"use client";

import { useQuery } from "@tanstack/react-query";
import type { ValueBet } from "@/src/lib/odds-api/types";
import { normalizeValueBet } from "@/src/lib/utils/odds";

export function useValueBets() {
  return useQuery<ValueBet[]>({
    queryKey: ["valueBets"],
    queryFn: async () => {
      const res = await fetch("/api/value-bets");
      if (!res.ok) throw new Error(`Failed to fetch value bets: ${res.status}`);
      const raw: Record<string, unknown>[] = await res.json();
      return raw.map(normalizeValueBet) as ValueBet[];
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
