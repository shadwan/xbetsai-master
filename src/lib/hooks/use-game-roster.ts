"use client";

import { useQuery } from "@tanstack/react-query";
import { getEspnTeamId } from "@/src/lib/utils/espn-ids";
import type { GameRoster } from "@/src/lib/espn/client";

async function fetchRoster(
  leagueSlug: string,
  homeId: string,
  awayId: string,
): Promise<GameRoster | null> {
  const params = new URLSearchParams({ league: leagueSlug, homeId, awayId });
  const res = await fetch(`/api/espn/roster?${params}`);
  if (!res.ok) return null;
  return res.json();
}

export function useGameRoster(
  leagueSlug: string,
  homeTeamName: string,
  awayTeamName: string,
) {
  const homeId = getEspnTeamId(leagueSlug, homeTeamName);
  const awayId = getEspnTeamId(leagueSlug, awayTeamName);

  const enabled = !!leagueSlug && !!homeId && !!awayId;

  const { data, isLoading } = useQuery({
    queryKey: ["espn-roster", leagueSlug, homeTeamName, awayTeamName],
    queryFn: () => fetchRoster(leagueSlug, homeId!, awayId!),
    staleTime: 300_000, // 5 min
    enabled,
  });

  return {
    roster: data ?? null,
    isLoading: isLoading && enabled,
  };
}
