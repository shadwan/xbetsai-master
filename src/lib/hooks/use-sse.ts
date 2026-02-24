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
      const eid = String(payload.event.id);

      // Update single-event query
      queryClient.setQueryData(["odds", eid], payload);

      // Merge into every list query (["odds", { sport }]) in-place
      queryClient.setQueriesData<ConsolidatedOddsEvent[]>(
        { queryKey: ["odds"] },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          const idx = old.findIndex((ev) => String(ev.event.id) === eid);
          if (idx >= 0) {
            const next = [...old];
            next[idx] = payload;
            return next;
          }
          return [...old, payload];
        },
      );
    });

    es.addEventListener("events", (e: MessageEvent) => {
      const payload: { leagueSlug: string; events: Event[] } = JSON.parse(e.data);
      queryClient.setQueryData(["events", payload.leagueSlug], payload.events);

      // Merge into the all-events query in-place
      queryClient.setQueryData<Record<string, Event[]>>(
        ["events"],
        (old) => {
          if (!old) return { [payload.leagueSlug]: payload.events };
          return { ...old, [payload.leagueSlug]: payload.events };
        },
      );
    });

    es.addEventListener("valuebets", (e: MessageEvent) => {
      const data: ValueBet[] = JSON.parse(e.data);
      queryClient.setQueryData(["valueBets"], data);
    });

    es.addEventListener("arbbets", (e: MessageEvent) => {
      const data: ArbitrageBet[] = JSON.parse(e.data);
      queryClient.setQueryData(["arbBets"], data);
    });

    return () => {
      es.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [queryClient]);
}
