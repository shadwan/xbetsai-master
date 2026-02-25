"use client";

import { useQuery } from "@tanstack/react-query";

export interface PlayerHeadshotResult {
  headshotUrl: string | null;
  isLoading: boolean;
}

async function fetchHeadshot(
  playerName: string,
  league: string,
): Promise<{ headshotUrl: string | null }> {
  const params = new URLSearchParams({ name: playerName, league });
  const res = await fetch(`/api/espn/player?${params}`);
  if (!res.ok) return { headshotUrl: null };
  return res.json();
}

export function usePlayerHeadshot(
  playerName: string,
  league: string,
): PlayerHeadshotResult {
  const enabled = !!playerName && !!league;

  const { data, isLoading } = useQuery({
    queryKey: ["espn-player-headshot", league, playerName],
    queryFn: () => fetchHeadshot(playerName, league),
    staleTime: 86_400_000, // 24hr
    enabled,
  });

  return {
    headshotUrl: data?.headshotUrl ?? null,
    isLoading: isLoading && enabled,
  };
}
