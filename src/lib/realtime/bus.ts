// ---------------------------------------------------------------------------
// Event bus — module-scoped typed EventEmitter singleton
// ---------------------------------------------------------------------------

import { EventEmitter } from "node:events";
import type { Event, ValueBet } from "odds-api-io";
import type { ArbitrageBet, ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";

// ── Event map ─────────────────────────────────────────────────────────────

export interface BusEvents {
  "odds:updated": ConsolidatedOddsEvent;
  "odds:deleted": { eventId: string; bookie: string };
  "valuebets:updated": ValueBet[];
  "arbbets:updated": ArbitrageBet[];
  "events:updated": { leagueSlug: string; events: Event[] };
  "event:created": { eventId: string; bookie: string };
  "event:deleted": { eventId: string };
}

// ── Singleton via globalThis (survives Turbopack re-bundling) ────────────

const g = globalThis as unknown as { __xbets_bus?: EventEmitter };
const bus = (g.__xbets_bus ??= (() => {
  const ee = new EventEmitter();
  ee.setMaxListeners(50);
  return ee;
})());

// ── Type-safe helpers ─────────────────────────────────────────────────────

export function emit<K extends keyof BusEvents>(
  event: K,
  payload: BusEvents[K],
): boolean {
  return bus.emit(event, payload);
}

export function on<K extends keyof BusEvents>(
  event: K,
  handler: (payload: BusEvents[K]) => void,
): void {
  bus.on(event, handler as (...args: unknown[]) => void);
}

export function off<K extends keyof BusEvents>(
  event: K,
  handler: (payload: BusEvents[K]) => void,
): void {
  bus.off(event, handler as (...args: unknown[]) => void);
}

export { bus };
