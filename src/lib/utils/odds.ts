import type { ConsolidatedOddsEvent, WsMarket, WsOddsOutcome } from "@/src/lib/odds-api/types";
import type { Event } from "odds-api-io";

/**
 * Safely extract team names from an Event.
 * The SDK types declare `homeParticipant.name` / `awayParticipant.name`,
 * but the actual API returns `home` / `away` as plain strings.
 */
export function getTeamNames(event: Event): { home: string; away: string } {
  const raw = event as unknown as Record<string, unknown>;
  const home =
    (typeof raw.home === "string" ? raw.home : null) ??
    event.homeParticipant?.name ??
    "Home";
  const away =
    (typeof raw.away === "string" ? raw.away : null) ??
    event.awayParticipant?.name ??
    "Away";
  return { home, away };
}

/**
 * Safely extract start time from an Event.
 * The actual API returns `date`, SDK types declare `startTime`.
 */
export function getStartTime(event: Event): string {
  const raw = event as unknown as { date?: string };
  return raw.date || event.startTime || "";
}

/**
 * Safely extract the league slug from an Event.
 * The actual API returns `league: { slug, name }` (object),
 * while the SDK types declare `leagueId` (string).
 */
export function getLeagueSlug(event: Event): string {
  const raw = event as unknown as Record<string, unknown>;
  // Actual API: league is { slug: string, name: string }
  if (raw.league && typeof raw.league === "object") {
    const league = raw.league as { slug?: string; id?: string };
    if (league.slug) return league.slug;
    if (league.id) return String(league.id);
  }
  // SDK type fallback
  if (event.leagueId) return event.leagueId;
  // String fallback
  if (typeof raw.league === "string") return raw.league;
  return "";
}

// ── BetMGM home/away swap ─────────────────────────────────────────────────
//
// The Odds-API upstream feed for BetMGM systematically swaps home/away odds
// (confirmed across 10/10 NBA events — every ML entry has the values reversed
/**
 * Previously swapped BetMGM home/away data due to an API bug.
 * The API has been fixed as of March 2026 — this is now a no-op passthrough.
 */
export function fixBookmakerMarkets(
  _bookmaker: string,
  markets: readonly WsMarket[],
): readonly WsMarket[] {
  return markets;
}

/**
 * Convert decimal odds to American odds.
 * d >= 2 → positive, d < 2 → negative.
 */
export function decimalToAmerican(d: number): number {
  if (!d || d <= 1) return 0;
  if (d >= 2) return Math.round((d - 1) * 100);
  return Math.round(-100 / (d - 1));
}

/**
 * Convert American odds to decimal odds.
 */
export function americanToDecimal(a: number): number {
  if (a > 0) return a / 100 + 1;
  return 100 / Math.abs(a) + 1;
}

/**
 * Implied probability from decimal odds (returns 0–1).
 */
export function impliedProbability(d: number): number {
  if (!d || d <= 0) return 0;
  return 1 / d;
}

export interface BestOddsEntry {
  bookmaker: string;
  odds: number;
}

/**
 * Find the best decimal odds per outcome across bookmakers for a given market name.
 */
export function findBestOdds(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
): Record<string, BestOddsEntry> {
  const best: Record<string, BestOddsEntry> = {};

  for (const [bk, data] of Object.entries(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market || market.odds.length === 0) continue;

    const outcome = market.odds[0];
    const keys = ["home", "away", "draw", "over", "under"] as const;

    for (const key of keys) {
      const val = outcome[key];
      if (val == null) continue;
      const decimal = parseFloat(val);
      if (isNaN(decimal)) continue;
      if (!best[key] || decimal > best[key].odds) {
        best[key] = { bookmaker: bk, odds: decimal };
      }
    }
  }

  return best;
}

/**
 * Normalize a ValueBet from the raw odds-api.io response into our app shape.
 *
 * Raw shape from API:
 * {
 *   id, eventId, expectedValue (e.g. 102.03 = 2.03% EV),
 *   betSide ("home"|"away"|"over"|"under"),
 *   market: { name: "ML"|"Spread"|"Totals", hdp?, home: "1.945", away: "2.058", ... },
 *   bookmaker: "DraftKings",
 *   bookmakerOdds: { home: "1.76", away: "2.10", hdp?, href },
 * }
 */
export function normalizeValueBet(raw: Record<string, unknown>): {
  eventId: string;
  bookmaker: string;
  market: string;
  marketLine?: string | number;
  outcome: string;
  odds: number;
  fairOdds: number;
  valuePercentage: number;
  bookmakerHref?: string;
  event?: Event;
} {
  const mkt = raw.market as Record<string, unknown> | string | undefined;
  const bkOdds = raw.bookmakerOdds as Record<string, unknown> | undefined;
  const betSide = String(raw.betSide ?? raw.outcome ?? "");

  // Market name: either market.name (object) or market (string)
  const marketName =
    mkt && typeof mkt === "object" ? String(mkt.name ?? "") : String(mkt ?? "");

  // Market line (hdp for spreads/totals)
  const marketLine =
    mkt && typeof mkt === "object" ? (mkt.hdp as number | undefined) : undefined;

  // Bookmaker odds: bookmakerOdds[betSide] (string like "2.10")
  const oddsVal = bkOdds && betSide ? parseFloat(String(bkOdds[betSide] ?? 0)) : 0;

  // Fair odds: market[betSide] (string like "1.945")
  const fairOddsVal =
    mkt && typeof mkt === "object" && betSide ? parseFloat(String(mkt[betSide] ?? 0)) : 0;

  // EV: expectedValue is like 102.03 meaning 2.03% edge; fall back to valuePercentage
  const ev = raw.expectedValue ?? raw.valuePercentage ?? raw.value_percentage ?? raw.ev;
  let valuePercentage = 0;
  if (ev != null) {
    const n = Number(ev);
    // If > 10, it's the "100 + EV%" format (e.g. 102.03 → 2.03%)
    valuePercentage = n > 10 ? n - 100 : n;
  }

  return {
    eventId: String(raw.eventId ?? raw.event_id ?? ""),
    bookmaker: String(raw.bookmaker ?? ""),
    market: marketName,
    marketLine: marketLine ?? (raw.marketLine as number | undefined),
    outcome: betSide,
    odds: oddsVal || Number(raw.odds ?? 0),
    fairOdds: fairOddsVal || Number(raw.fairOdds ?? raw.fair_odds ?? 0),
    valuePercentage,
    bookmakerHref: bkOdds ? String(bkOdds.href ?? "") : undefined,
    event: raw.event as Event | undefined,
  };
}

/**
 * Normalize an ArbitrageBet from the raw odds-api.io response.
 *
 * Raw shape from API:
 * {
 *   id, eventId, profitMargin (e.g. 6.83),
 *   market: { name: "Totals", hdp: 2.5 },
 *   legs: [{ bookmaker, side, odds: "1.63", href }],
 *   optimalStakes: [{ bookmaker, side, stake: 655.39, potentialReturn }],
 * }
 */
export function normalizeArbBet(raw: Record<string, unknown>): {
  eventId: string;
  market: string;
  marketLine?: string | number;
  profitPercentage: number;
  legs: Array<{ outcome: string; bookmaker: string; odds: number; stake?: number; href?: string }>;
  event?: Event;
  updatedAt?: string;
} {
  const mkt = raw.market as Record<string, unknown> | string | undefined;
  const marketName =
    mkt && typeof mkt === "object" ? String(mkt.name ?? "") : String(mkt ?? "");
  const marketLine =
    mkt && typeof mkt === "object" ? (mkt.hdp as number | undefined) : undefined;

  const rawLegs = (raw.legs ?? []) as Array<Record<string, unknown>>;
  const rawStakes = (raw.optimalStakes ?? []) as Array<Record<string, unknown>>;

  // Build a lookup for optimal stakes by bookmaker+side
  const stakeMap = new Map<string, number>();
  for (const s of rawStakes) {
    const key = `${s.bookmaker}:${s.side}`;
    stakeMap.set(key, Number(s.stake ?? 0));
  }

  return {
    eventId: String(raw.eventId ?? raw.event_id ?? ""),
    market: marketName,
    marketLine: marketLine ?? (raw.marketLine as number | undefined),
    profitPercentage: Number(raw.profitMargin ?? raw.profitPercentage ?? raw.profit_percentage ?? 0),
    legs: rawLegs.map((leg) => ({
      outcome: String(leg.side ?? leg.outcome ?? ""),
      bookmaker: String(leg.bookmaker ?? ""),
      odds: parseFloat(String(leg.odds ?? 0)),
      stake: stakeMap.get(`${leg.bookmaker}:${leg.side}`) ?? undefined,
      href: leg.href ? String(leg.href) : undefined,
    })),
    event: raw.event as Event | undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

/**
 * Format a market line for display.
 * Spread: "+3.5" / "-7". Totals: "O/U 45.5". ML: empty string.
 */
export function formatLine(marketName: string, hdp?: number): string {
  if (hdp == null) return "";
  const lower = marketName.toLowerCase();
  if (lower.includes("spread")) {
    return hdp > 0 ? `+${hdp}` : `${hdp}`;
  }
  if (lower.includes("total")) {
    return `O/U ${hdp}`;
  }
  return "";
}
