import type { ConsolidatedOddsEvent, WsMarket } from "@/src/lib/odds-api/types";
import type { Event } from "odds-api-io";

/**
 * Safely extract team names from an Event.
 * The SDK types declare `homeParticipant.name` / `awayParticipant.name`,
 * but the raw API may return `home` / `away` as plain strings instead.
 */
export function getTeamNames(event: Event): { home: string; away: string } {
  const raw = event as unknown as Record<string, unknown>;
  const home =
    event.homeParticipant?.name ??
    (typeof raw.home === "string" ? raw.home : "Home");
  const away =
    event.awayParticipant?.name ??
    (typeof raw.away === "string" ? raw.away : "Away");
  return { home, away };
}

/**
 * Safely extract start time from an Event.
 * The API may return `date` instead of `startTime`.
 */
export function getStartTime(event: Event): string {
  return event.startTime || (event as unknown as { date: string }).date || "";
}

/**
 * Convert decimal odds to American odds.
 * d >= 2 → positive, d < 2 → negative.
 */
export function decimalToAmerican(d: number): number {
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
 * Normalize a ValueBet from raw API shape (which may use snake_case or
 * different field names) into the shape our components expect.
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
  event?: unknown;
} {
  return {
    eventId: String(raw.eventId ?? raw.event_id ?? ""),
    bookmaker: String(raw.bookmaker ?? ""),
    market: String(raw.market ?? ""),
    marketLine: (raw.marketLine ?? raw.market_line) as string | number | undefined,
    outcome: String(raw.outcome ?? ""),
    odds: Number(raw.odds ?? 0),
    fairOdds: Number(raw.fairOdds ?? raw.fair_odds ?? raw.fairodds ?? 0),
    valuePercentage: Number(raw.valuePercentage ?? raw.value_percentage ?? raw.ev ?? 0),
    event: raw.event,
  };
}

/**
 * Normalize an ArbitrageBet from raw API shape.
 */
export function normalizeArbBet(raw: Record<string, unknown>): {
  eventId: string;
  market: string;
  marketLine?: string | number;
  profitPercentage: number;
  legs: Array<{ outcome: string; bookmaker: string; odds: number; stake?: number }>;
  event?: unknown;
} {
  const rawLegs = (raw.legs ?? []) as Array<Record<string, unknown>>;
  return {
    eventId: String(raw.eventId ?? raw.event_id ?? ""),
    market: String(raw.market ?? ""),
    marketLine: (raw.marketLine ?? raw.market_line) as string | number | undefined,
    profitPercentage: Number(raw.profitPercentage ?? raw.profit_percentage ?? raw.profit ?? 0),
    legs: rawLegs.map((leg) => ({
      outcome: String(leg.outcome ?? ""),
      bookmaker: String(leg.bookmaker ?? ""),
      odds: Number(leg.odds ?? 0),
      stake: leg.stake != null ? Number(leg.stake) : undefined,
    })),
    event: raw.event,
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
