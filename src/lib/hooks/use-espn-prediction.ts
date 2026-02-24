"use client";

import { useQuery } from "@tanstack/react-query";
import { getEspnTeamId } from "@/src/lib/utils/espn-ids";
import type { GamePrediction } from "@/src/lib/espn/client";

export interface EspnPredictionResult {
  homeWinProb: number | null;
  awayWinProb: number | null;
  isLoading: boolean;
}

async function fetchPrediction(
  leagueSlug: string,
  homeId: string,
  awayId: string,
): Promise<GamePrediction | null> {
  const params = new URLSearchParams({ league: leagueSlug, homeId, awayId });
  const res = await fetch(`/api/espn/prediction?${params}`);
  if (!res.ok) return null;
  return res.json();
}

export function useEspnPrediction(
  leagueSlug: string,
  homeTeamName: string,
  awayTeamName: string,
): EspnPredictionResult {
  const homeId = getEspnTeamId(leagueSlug, homeTeamName);
  const awayId = getEspnTeamId(leagueSlug, awayTeamName);

  const enabled = !!leagueSlug && !!homeId && !!awayId;

  const { data, isLoading } = useQuery({
    queryKey: ["espn-prediction", leagueSlug, homeTeamName, awayTeamName],
    queryFn: () => fetchPrediction(leagueSlug, homeId!, awayId!),
    staleTime: 300_000, // 5 min
    enabled,
  });

  return {
    homeWinProb: data?.homeWinProb ?? null,
    awayWinProb: data?.awayWinProb ?? null,
    isLoading: isLoading && enabled,
  };
}
