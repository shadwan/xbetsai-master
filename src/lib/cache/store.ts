// ---------------------------------------------------------------------------
// In-memory cache store — module-scoped singleton
// ---------------------------------------------------------------------------

import type { Event, ValueBet } from "odds-api-io";
import type {
  CacheEntry,
  CacheStats,
  ConsolidatedOddsEvent,
  WsMarket,
} from "@/src/lib/odds-api/types";

// ── Module-scoped state (not exported) ──────────────────────────────────

const store = new Map<string, CacheEntry<unknown>>();

const stats = { hits: 0, misses: 0, wsWrites: 0, restWrites: 0, restUnchanged: 0, pruned: 0 };

let pruneIntervalId: ReturnType<typeof setInterval> | null = null;
const PRUNE_INTERVAL_MS = 60_000;

// ── Internal helpers ────────────────────────────────────────────────────

/** Fast non-crypto hash for change detection (djb2). */
function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0; // hash * 33 + c
  }
  return (hash >>> 0).toString(36);
}

function ensurePruneInterval(): void {
  if (pruneIntervalId !== null) return;
  pruneIntervalId = setInterval(prune, PRUNE_INTERVAL_MS);
  // Allow Node.js to exit even if the interval is still active
  if (typeof pruneIntervalId === "object" && "unref" in pruneIntervalId) {
    pruneIntervalId.unref();
  }
}

function findEventById(eventId: string): Event | null {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (!key.startsWith("events:")) continue;
    if (entry.expiresAt <= now) continue;
    const events = entry.data as Event[];
    const found = events.find((e) => e.id === eventId);
    if (found) return found;
  }
  return null;
}

// ── Exported cache methods ──────────────────────────────────────────────

export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) {
    stats.misses++;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    // Don't delete here — prune() handles cleanup
    stats.misses++;
    return null;
  }
  stats.hits++;
  return entry.data as T;
}

export function set<T>(key: string, data: T, ttl: number, source: "ws" | "rest" = "rest"): void {
  const now = Date.now();
  store.set(key, {
    data,
    createdAt: now,
    expiresAt: now + ttl,
    hash: djb2Hash(JSON.stringify(data)),
  });
  if (source === "ws") {
    stats.wsWrites++;
  } else {
    stats.restWrites++;
  }
  ensurePruneInterval();
}

/**
 * Write only if the data has changed (compared by djb2 hash of JSON).
 * If unchanged, bumps the TTL and returns `false`.
 * If changed (or new), writes and returns `true`.
 */
export function setIfChanged<T>(key: string, data: T, ttl: number): boolean {
  const json = JSON.stringify(data);
  const newHash = djb2Hash(json);
  const now = Date.now();

  const existing = store.get(key);
  if (existing && existing.hash === newHash && existing.expiresAt > now) {
    // Same data — just bump TTL
    store.set(key, { ...existing, expiresAt: now + ttl });
    stats.restUnchanged++;
    return false;
  }

  store.set(key, { data, createdAt: now, expiresAt: now + ttl, hash: newHash });
  stats.restWrites++;
  ensurePruneInterval();
  return true;
}

export function del(key: string): boolean {
  return store.delete(key);
}

export function has(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return entry.expiresAt > Date.now();
}

export function keys(prefix?: string): string[] {
  const now = Date.now();
  const result: string[] = [];
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) continue;
    if (prefix && !key.startsWith(prefix)) continue;
    result.push(key);
  }
  return result;
}

export function prune(): number {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(key);
      removed++;
    }
  }
  stats.pruned += removed;

  if (store.size === 0 && pruneIntervalId !== null) {
    clearInterval(pruneIntervalId);
    pruneIntervalId = null;
  }

  return removed;
}

export function getStats(): CacheStats {
  return {
    size: store.size,
    hits: stats.hits,
    misses: stats.misses,
    wsWrites: stats.wsWrites,
    restWrites: stats.restWrites,
    restUnchanged: stats.restUnchanged,
    pruned: stats.pruned,
  };
}

export function clear(): void {
  store.clear();
  if (pruneIntervalId !== null) {
    clearInterval(pruneIntervalId);
    pruneIntervalId = null;
  }
}

// ── Consolidation helpers ───────────────────────────────────────────────

export function getConsolidatedEvent(
  eventId: string,
): ConsolidatedOddsEvent | null {
  const event = findEventById(eventId);
  if (!event) return null;

  const prefix = `odds:${eventId}:`;
  const oddsKeys = keys(prefix);

  const bookmakers: Record<
    string,
    { url: string; markets: readonly WsMarket[] }
  > = {};
  let lastUpdated = 0;

  for (const key of oddsKeys) {
    const bookie = key.slice(prefix.length);
    const entry = store.get(key) as CacheEntry<{
      url: string;
      markets: readonly WsMarket[];
    }> | undefined;
    if (!entry || entry.expiresAt <= Date.now()) continue;

    bookmakers[bookie] = entry.data;
    if (entry.createdAt > lastUpdated) lastUpdated = entry.createdAt;
  }

  return { event, bookmakers, lastUpdated };
}

export function getAllValueBets(): ValueBet[] {
  const valueBetKeys = keys("value-bets:");
  const seen = new Set<string>();
  const result: ValueBet[] = [];

  for (const key of valueBetKeys) {
    const bets = get<ValueBet[]>(key);
    if (!bets) continue;
    for (const bet of bets) {
      const dedupeKey = `${bet.eventId}:${bet.bookmaker}:${bet.market}:${bet.outcome}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      result.push(bet);
    }
  }

  result.sort((a, b) => b.valuePercentage - a.valuePercentage);
  return result;
}

export function getEventsBySport(leagueSlug: string): Event[] {
  return get<Event[]>(`events:${leagueSlug}`) ?? [];
}

export function getAllConsolidatedEvents(
  leagueSlug: string,
): ConsolidatedOddsEvent[] {
  const events = getEventsBySport(leagueSlug);
  const result: ConsolidatedOddsEvent[] = [];

  for (const event of events) {
    const consolidated = getConsolidatedEvent(event.id);
    if (consolidated) result.push(consolidated);
  }

  return result;
}
