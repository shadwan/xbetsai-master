"use client";

import { useQuery } from "@tanstack/react-query";
import type { Event } from "odds-api-io";

async function fetchEvents(sport?: string) {
  const url = sport ? `/api/events?sport=${sport}` : "/api/events";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  return res.json();
}

export function useEvents(sport?: string) {
  return useQuery<Event[] | Record<string, Event[]>>({
    queryKey: sport ? ["events", sport] : ["events"],
    queryFn: () => fetchEvents(sport),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
