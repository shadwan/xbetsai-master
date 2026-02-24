// ---------------------------------------------------------------------------
// REST pollers — background data fetching for everything the WS doesn't cover
// ---------------------------------------------------------------------------

import { oddsClient } from "@/src/lib/odds-api/client";
import * as cache from "@/src/lib/cache/store";
import { emit } from "@/src/lib/realtime/bus";
import { getWSStatus } from "@/src/lib/realtime/ws-client";
import {
  SPORTS,
  BOOKMAKERS,
  BOOKMAKERS_PARAM,
  CACHE_TTL,
  POLL_INTERVAL,
} from "@/src/lib/odds-api/constants";
import type {
  EventOdds,
  Event,
  HistoricalEventOdds,
  WsMarket,
  WsOddsOutcome,
  ArbitrageBet,
} from "@/src/lib/odds-api/types";
import { normalizeValueBet, normalizeArbBet } from "@/src/lib/utils/odds";

// ── Module state ─────────────────────────────────────────────────────────

let running = false;
const activeSports = new Set<string>(); // league slugs with >0 events
const timers: ReturnType<typeof setTimeout>[] = [];
let wsFallbackActive = false;
let wsFallbackTimer: ReturnType<typeof setInterval> | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transform REST EventOdds into per-bookmaker cache entries matching the
 * WS format: `odds:{eventId}:{bookie}` → `{ url: "", markets: WsMarket[] }`.
 *
 * REST MarketOdds have outcomes with `bookmaker` field — we group by bookmaker,
 * then by market name, converting to WsOddsOutcome shape.
 */
function transformOddsToCache(
  eventOdds: EventOdds,
): Map<string, { url: string; markets: WsMarket[] }> {
  // Group: bookmaker → market → outcomes
  const byBookie = new Map<
    string,
    Map<string, { name: string; timestamp: number; outcomes: WsOddsOutcome[] }>
  >();

  for (const market of eventOdds.markets) {
    for (const outcome of market.outcomes) {
      let bookieMarkets = byBookie.get(outcome.bookmaker);
      if (!bookieMarkets) {
        bookieMarkets = new Map();
        byBookie.set(outcome.bookmaker, bookieMarkets);
      }

      let marketEntry = bookieMarkets.get(market.market);
      if (!marketEntry) {
        marketEntry = {
          name: market.market,
          timestamp: outcome.timestamp,
          outcomes: [],
        };
        bookieMarkets.set(market.market, marketEntry);
      }

      // Build WsOddsOutcome based on outcome name
      const oddsStr = String(outcome.odds);
      const wsOutcome: WsOddsOutcome = {};

      const nameLower = outcome.name.toLowerCase();
      if (nameLower === "home" || nameLower === "over") {
        Object.assign(wsOutcome, nameLower === "home"
          ? { home: oddsStr }
          : { over: oddsStr });
      } else if (nameLower === "away" || nameLower === "under") {
        Object.assign(wsOutcome, nameLower === "away"
          ? { away: oddsStr }
          : { under: oddsStr });
      } else if (nameLower === "draw") {
        Object.assign(wsOutcome, { draw: oddsStr });
      } else {
        // Fallback: use home for first, away for second
        Object.assign(wsOutcome, { home: oddsStr });
      }

      if (market.marketLine != null) {
        Object.assign(wsOutcome, { hdp: Number(market.marketLine) });
      }

      marketEntry.outcomes.push(wsOutcome);

      if (outcome.timestamp > marketEntry.timestamp) {
        marketEntry.timestamp = outcome.timestamp;
      }
    }
  }

  // Convert to final shape
  const result = new Map<string, { url: string; markets: WsMarket[] }>();

  for (const [bookie, marketsMap] of byBookie) {
    const markets: WsMarket[] = [];
    for (const entry of marketsMap.values()) {
      markets.push({
        name: entry.name,
        updatedAt: new Date(entry.timestamp).toISOString(),
        odds: entry.outcomes,
      });
    }
    result.set(bookie, { url: "", markets });
  }

  return result;
}

/** Get events that are live or starting within 24 hours. */
function getUpcoming24hAndLiveEvents(): Event[] {
  const now = Date.now();
  const in24h = now + 24 * 60 * 60 * 1_000;
  const events: Event[] = [];

  for (const s of SPORTS) {
    if (!activeSports.has(s.leagueSlug)) continue;
    const cached = cache.get<Event[]>(`events:${s.leagueSlug}`);
    if (!cached) continue;

    for (const e of cached) {
      // API returns status as "live"/"pending"/"settled" — handle both SDK and API shapes
      const status = e.status as string | undefined;
      if (status === "live") {
        events.push(e);
      } else if (status !== "finished" && status !== "settled") {
        // API may return `date` instead of `startTime`
        const dateStr = e.startTime || (e as unknown as { date: string }).date;
        const start = new Date(dateStr).getTime();
        if (!isNaN(start) && start <= in24h && start >= now) {
          events.push(e);
        }
      }
    }
  }

  return events;
}

// ── Data fetchers ────────────────────────────────────────────────────────

/** 1. Sports & leagues — startup only (static data). */
async function fetchSportsAndLeagues(): Promise<void> {
  try {
    const sports = await oddsClient.getSports();
    cache.set("sports", sports, CACHE_TTL.SPORTS);
    console.log(`[poller] Fetched ${sports.length} sports`);
  } catch (err) {
    console.warn("[poller] Failed to fetch sports:", (err as Error).message);
  }

  const fetchedSlugs = new Set<string>();
  for (const s of SPORTS) {
    if (fetchedSlugs.has(s.sportSlug)) continue;
    fetchedSlugs.add(s.sportSlug);

    try {
      const leagues = await oddsClient.getLeagues(s.sportSlug);
      cache.set(`leagues:${s.sportSlug}`, leagues, CACHE_TTL.LEAGUES);
      console.log(`[poller] Fetched ${leagues.length} leagues for ${s.sportSlug}`);
    } catch (err) {
      console.warn(`[poller] Failed to fetch leagues for ${s.sportSlug}:`, (err as Error).message);
    }
  }
}

/** 2. Fetch events for all 6 sports — detects active sports. */
async function fetchAllEvents(): Promise<void> {
  for (const s of SPORTS) {
    try {
      const events = await oddsClient.getEvents({
        sport: s.sportSlug,
        league: s.leagueSlug,
      });

      cache.set(`events:${s.leagueSlug}`, events, CACHE_TTL.EVENTS);

      if (events.length > 0) {
        activeSports.add(s.leagueSlug);
        emit("events:updated", { leagueSlug: s.leagueSlug, events });
      } else {
        activeSports.delete(s.leagueSlug);
      }

      console.log(`[poller] ${s.displayName}: ${events.length} events`);
    } catch (err) {
      console.warn(`[poller] Failed to fetch events for ${s.displayName}:`, (err as Error).message);
    }
  }
}

/**
 * Store odds from the multi-event API response into cache.
 * The API returns objects like:
 * { id, home, away, date, status, sport, league, urls: { Bet365: "..." }, bookmakers: { Bet365: WsMarket[] } }
 */
function storeMultiEventOdds(results: unknown[]): void {
  for (const item of results) {
    const raw = item as Record<string, unknown>;
    const eventId = String(raw.id);
    const urls = (raw.urls ?? {}) as Record<string, string>;
    const bookmakers = raw.bookmakers as Record<string, WsMarket[]> | undefined;

    // Handle SDK-typed EventOdds (has markets array) or raw API shape (has bookmakers object)
    if (raw.markets && Array.isArray(raw.markets)) {
      // SDK EventOdds shape
      const perBookie = transformOddsToCache(raw as unknown as EventOdds);
      for (const [bookie, data] of perBookie) {
        cache.set(`odds:${raw.eventId || eventId}:${bookie}`, data, CACHE_TTL.ODDS_REST, "rest");
      }
    } else if (bookmakers && typeof bookmakers === 'object') {
      // Raw API shape: bookmakers is { BookieName: WsMarket[] }
      for (const [bookie, markets] of Object.entries(bookmakers)) {
        if (!Array.isArray(markets)) continue;
        cache.set(
          `odds:${eventId}:${bookie}`,
          { url: urls[bookie] ?? "", markets },
          CACHE_TTL.ODDS_REST,
          "rest",
        );
      }
    } else {
      continue;
    }

    const consolidated = cache.getConsolidatedEvent(eventId);
    if (consolidated) {
      emit("odds:updated", consolidated);
    }
  }
}

/** 3. Initial odds snapshot for live + next-24h events. */
async function fetchInitialOdds(eventIds?: string[]): Promise<void> {
  const events = eventIds
    ? eventIds
    : getUpcoming24hAndLiveEvents().map((e) => String(e.id));

  if (events.length === 0) return;

  // Batch into groups of 10
  const batches: string[][] = [];
  for (let i = 0; i < events.length; i += 10) {
    batches.push(events.slice(i, i + 10));
  }

  console.log(`[poller] Initial odds: ${events.length} events, ${batches.length} batches`);

  for (const batch of batches) {
    try {
      const results = await oddsClient.getOddsForMultipleEvents({
        eventIds: batch.join(","),
        bookmakers: BOOKMAKERS_PARAM,
      });

      const oddsArray = Array.isArray(results) ? results : [results];
      storeMultiEventOdds(oddsArray);
    } catch (err) {
      console.warn("[poller] Failed to fetch odds batch:", (err as Error).message);
    }

    if (batches.indexOf(batch) < batches.length - 1) {
      await sleep(1_000);
    }
  }
}

/** 4. Participants — startup + daily refresh. */
async function fetchParticipants(): Promise<void> {
  const fetchedSlugs = new Set<string>();

  for (const s of SPORTS) {
    if (!activeSports.has(s.leagueSlug)) continue;
    if (fetchedSlugs.has(s.sportSlug)) continue;
    fetchedSlugs.add(s.sportSlug);

    try {
      const participants = await oddsClient.getParticipants({
        sport: s.sportSlug,
      });
      cache.set(`participants:${s.sportSlug}`, participants, CACHE_TTL.PARTICIPANTS);
      console.log(`[poller] Fetched ${participants.length} participants for ${s.sportSlug}`);
    } catch (err) {
      console.warn(`[poller] Failed to fetch participants for ${s.sportSlug}:`, (err as Error).message);
    }
  }
}

/** 5. Events poller — uses setIfChanged, only emits on change. */
async function pollEvents(): Promise<void> {
  const stagger = POLL_INTERVAL.EVENTS / SPORTS.length;
  const existingEventIds = new Set(
    getUpcoming24hAndLiveEvents().map((e) => e.id),
  );

  for (const s of SPORTS) {
    try {
      const events = await oddsClient.getEvents({
        sport: s.sportSlug,
        league: s.leagueSlug,
      });

      const changed = cache.setIfChanged(
        `events:${s.leagueSlug}`,
        events,
        CACHE_TTL.EVENTS,
      );

      if (events.length > 0) {
        activeSports.add(s.leagueSlug);
      } else {
        activeSports.delete(s.leagueSlug);
      }

      if (changed) {
        console.log(`[poller] Events updated for ${s.displayName}: ${events.length} events`);
        emit("events:updated", { leagueSlug: s.leagueSlug, events });
      }
    } catch (err) {
      console.warn(`[poller] Failed to poll events for ${s.displayName}:`, (err as Error).message);
    }

    await sleep(stagger);
  }

  // Check for newly entered events that need odds
  const currentEventIds = getUpcoming24hAndLiveEvents().map((e) => e.id);
  const newEventIds = currentEventIds.filter((id) => !existingEventIds.has(id));

  if (newEventIds.length > 0) {
    console.log(`[poller] ${newEventIds.length} new events need odds`);
    await fetchInitialOdds(newEventIds);
  }
}

/** 6. Value bets poller — per bookmaker, staggered. */
async function pollValueBets(): Promise<void> {
  let anyChanged = false;

  for (const bookmaker of BOOKMAKERS) {
    try {
      const rawBets = await oddsClient.getValueBets({ bookmaker });
      const bets = (rawBets as unknown as Record<string, unknown>[]).map(
        (b) => normalizeValueBet(b),
      );
      const changed = cache.setIfChanged(
        `value-bets:${bookmaker}`,
        bets,
        CACHE_TTL.VALUE_BETS,
      );

      if (changed) {
        console.log(`[poller] Value bets changed for ${bookmaker}: ${bets.length} bets`);
        anyChanged = true;
      }
    } catch (err) {
      console.warn(`[poller] Failed to fetch value bets for ${bookmaker}:`, (err as Error).message);
    }

    await sleep(3_000);
  }

  if (anyChanged) {
    const merged = cache.getAllValueBets();
    emit("valuebets:updated", merged);
  }
}

/** 7. Arb bets poller — single call. */
async function pollArbBets(): Promise<void> {
  try {
    const rawBets = await oddsClient.getArbitrageBets({
      bookmakers: BOOKMAKERS_PARAM,
    });
    const bets = (rawBets as unknown as Record<string, unknown>[]).map(
      (b) => normalizeArbBet(b),
    );

    const changed = cache.setIfChanged("arb-bets", bets, CACHE_TTL.ARB_BETS);
    if (changed) {
      console.log(`[poller] Arb bets updated: ${bets.length} bets`);
      emit("arbbets:updated", bets as ArbitrageBet[]);
    }
  } catch (err) {
    console.warn("[poller] Failed to fetch arb bets:", (err as Error).message);
  }
}

/** 8. WS fallback — polls odds via REST when WS is disconnected. */
function pollOddsFallback(): void {
  const run = async () => {
    const liveEvents = getUpcoming24hAndLiveEvents().filter(
      (e) => e.status === "live",
    );

    if (liveEvents.length === 0) return;

    const ids = liveEvents.map((e) => e.id);
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    for (const batch of batches) {
      try {
        const results = await oddsClient.getOddsForMultipleEvents({
          eventIds: batch.join(","),
          bookmakers: BOOKMAKERS_PARAM,
        });

        const oddsArr = Array.isArray(results) ? results : [results];
        storeMultiEventOdds(oddsArr);
      } catch (err) {
        console.warn("[poller] WS fallback odds batch error:", (err as Error).message);
      }

      await sleep(1_000);
    }
  };

  run().catch((err) =>
    console.warn("[poller] WS fallback poll error:", (err as Error).message),
  );
}

function startWsFallbackChecker(): void {
  const timer = setInterval(() => {
    const { connected } = getWSStatus();

    if (!connected && !wsFallbackActive) {
      console.log("[poller] WS disconnected — activating REST odds fallback");
      wsFallbackActive = true;

      // Immediately poll once, then every 30s
      pollOddsFallback();
      wsFallbackTimer = setInterval(pollOddsFallback, 30_000);
      timers.push(wsFallbackTimer as unknown as ReturnType<typeof setTimeout>);
    } else if (connected && wsFallbackActive) {
      console.log("[poller] WS reconnected — deactivating REST odds fallback");
      wsFallbackActive = false;

      if (wsFallbackTimer !== null) {
        clearInterval(wsFallbackTimer);
        wsFallbackTimer = null;
      }
    }
  }, 10_000);

  timers.push(timer as unknown as ReturnType<typeof setTimeout>);
}

// ── Periodic stats logging ───────────────────────────────────────────────

function startStatsLogger(): void {
  const timer = setInterval(() => {
    const stats = cache.getStats();
    console.log(
      `[poller] Cache stats — size: ${stats.size}, hits: ${stats.hits}, misses: ${stats.misses}, ` +
      `ws: ${stats.wsWrites}, rest: ${stats.restWrites}, unchanged: ${stats.restUnchanged}`,
    );
  }, 5 * 60 * 1_000);

  timers.push(timer as unknown as ReturnType<typeof setTimeout>);
}

// ── 9. Props (on-demand) ─────────────────────────────────────────────────

export async function fetchPropsForEvent(eventId: string): Promise<EventOdds> {
  const cached = cache.get<EventOdds>(`props:${eventId}`);
  if (cached) return cached;

  const result = await oddsClient.getEventOdds({
    eventId,
    bookmakers: BOOKMAKERS_PARAM,
  });

  cache.set(`props:${eventId}`, result, CACHE_TTL.PROPS);
  return result;
}

// ── 10. Historical odds (on-demand) ──────────────────────────────────────

export async function fetchHistoricalOdds(eventId: string): Promise<HistoricalEventOdds | null> {
  try {
    const cached = cache.get<HistoricalEventOdds>(`historical:${eventId}`);
    if (cached) return cached;

    const result = await oddsClient.getHistoricalOdds({
      eventId,
      bookmakers: BOOKMAKERS_PARAM,
    });

    cache.set(`historical:${eventId}`, result, CACHE_TTL.HISTORICAL);
    return result;
  } catch (err) {
    console.warn(`[poller] Failed to fetch historical odds for ${eventId}:`, (err as Error).message);
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────

export async function startPollers(): Promise<void> {
  if (running) return;
  running = true;

  try {
    // 1. Static data
    await fetchSportsAndLeagues();

    // 2. Events (populates cache, detects active sports)
    await fetchAllEvents();

    // 3. Initial odds snapshot (live + next 24h)
    await fetchInitialOdds();

    // 4. Participants
    await fetchParticipants();

    // 5. Start repeating pollers
    const eventsTimer = setInterval(() => {
      pollEvents().catch((err) =>
        console.warn("[poller] Events poll error:", (err as Error).message),
      );
    }, POLL_INTERVAL.EVENTS);
    timers.push(eventsTimer as unknown as ReturnType<typeof setTimeout>);

    const valueBetsTimer = setInterval(() => {
      pollValueBets().catch((err) =>
        console.warn("[poller] Value bets poll error:", (err as Error).message),
      );
    }, POLL_INTERVAL.VALUE_BETS);
    timers.push(valueBetsTimer as unknown as ReturnType<typeof setTimeout>);

    const arbBetsTimer = setInterval(() => {
      pollArbBets().catch((err) =>
        console.warn("[poller] Arb bets poll error:", (err as Error).message),
      );
    }, POLL_INTERVAL.ARB_BETS);
    timers.push(arbBetsTimer as unknown as ReturnType<typeof setTimeout>);

    // 5b. Periodic odds refresh — keeps odds alive regardless of WS activity
    const oddsRefreshTimer = setInterval(() => {
      fetchInitialOdds().catch((err) =>
        console.warn("[poller] Odds refresh error:", (err as Error).message),
      );
    }, POLL_INTERVAL.ODDS);
    timers.push(oddsRefreshTimer as unknown as ReturnType<typeof setTimeout>);

    // 6. WS fallback checker
    startWsFallbackChecker();

    // 7. 30-min active sport recheck
    const sportRecheckTimer = setInterval(() => {
      fetchAllEvents().catch((err) =>
        console.warn("[poller] Sport recheck error:", (err as Error).message),
      );
    }, 30 * 60 * 1_000);
    timers.push(sportRecheckTimer as unknown as ReturnType<typeof setTimeout>);

    // 8. Daily participants refresh
    const participantsTimer = setInterval(() => {
      fetchParticipants().catch((err) =>
        console.warn("[poller] Participants refresh error:", (err as Error).message),
      );
    }, 24 * 60 * 60 * 1_000);
    timers.push(participantsTimer as unknown as ReturnType<typeof setTimeout>);

    // 9. Stats logger
    startStatsLogger();

    console.log(
      `[poller] Startup complete — active sports: [${[...activeSports].join(", ")}]`,
    );
  } catch (err) {
    console.error("[poller] Startup failed:", (err as Error).message);
    stopPollers();
  }
}

export function stopPollers(): void {
  for (const timer of timers) {
    clearInterval(timer);
    clearTimeout(timer);
  }
  timers.length = 0;

  if (wsFallbackTimer !== null) {
    clearInterval(wsFallbackTimer);
    wsFallbackTimer = null;
  }

  running = false;
  wsFallbackActive = false;

  console.log("[poller] Shutdown complete");
}
