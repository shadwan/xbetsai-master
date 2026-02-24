"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ConsolidatedOddsEvent, ArbitrageBet, ValueBet } from "@/src/lib/odds-api/types";
import type { Event } from "odds-api-io";

// Module-level connected state for useSSEStatus
let _connected = false;
const listeners = new Set<(v: boolean) => void>();

function setConnected(v: boolean) {
  _connected = v;
  for (const fn of listeners) fn(v);
}

export function useSSEStatus(): { connected: boolean } {
  const [connected, setLocal] = useState(_connected);

  useEffect(() => {
    listeners.add(setLocal);
    return () => {
      listeners.delete(setLocal);
    };
  }, []);

  return { connected };
}

export function useSSE(): void {
  const queryClient = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    sourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      console.warn("[SSE] Connection error — EventSource will auto-reconnect");
    };

    es.addEventListener("odds", (e: MessageEvent) => {
      const payload: ConsolidatedOddsEvent = JSON.parse(e.data);
      queryClient.setQueryData(["odds", String(payload.event.id)], payload);
      queryClient.invalidateQueries({ queryKey: ["odds"] });
    });

    es.addEventListener("events", (e: MessageEvent) => {
      const payload: { leagueSlug: string; events: Event[] } = JSON.parse(e.data);
      queryClient.setQueryData(["events", payload.leagueSlug], payload.events);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    });

    es.addEventListener("valuebets", (e: MessageEvent) => {
      const payload: ValueBet[] = JSON.parse(e.data);
      queryClient.setQueryData(["valueBets"], payload);
    });

    es.addEventListener("arbbets", (e: MessageEvent) => {
      const payload: ArbitrageBet[] = JSON.parse(e.data);
      queryClient.setQueryData(["arbBets"], payload);
    });

    return () => {
      es.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [queryClient]);
}
