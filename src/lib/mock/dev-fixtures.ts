/**
 * Mock fixtures for dev-only league page.
 * 3 NBA events: 1 live, 1 today, 1 tomorrow.
 * Uses real team names so TeamLogo / team-abbrevs resolve correctly.
 */

import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";
import type { ValueBet, ArbitrageBet } from "odds-api-io";

// ── Time helpers (relative to now) ──────────────────────────────────────────

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

function tomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}

// ── Fake Event builder ──────────────────────────────────────────────────────

/**
 * Build an Event that matches the actual API shape (home/away as strings,
 * date instead of startTime, league as { slug, name }).
 */
function makeEvent(opts: {
  id: string;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
  date: string;
  status: "live" | "upcoming";
}) {
  return {
    id: opts.id,
    sport: "basketball",
    league: { slug: "usa-nba", name: "NBA" },
    leagueId: "usa-nba",
    startTime: opts.date,
    date: opts.date,
    status: opts.status,
    home: opts.home,
    away: opts.away,
    homeParticipant: { id: opts.homeId, name: opts.home },
    awayParticipant: { id: opts.awayId, name: opts.away },
  };
}

// ── Bookmaker odds builder ──────────────────────────────────────────────────

function mlMarket(home: string, away: string) {
  return {
    name: "ML" as const,
    updatedAt: new Date().toISOString(),
    odds: [{ home, away }],
  };
}

function spreadMarket(home: string, away: string, hdp: number) {
  return {
    name: "Spread" as const,
    updatedAt: new Date().toISOString(),
    odds: [{ home, away, hdp }],
  };
}

function totalsMarket(over: string, under: string, hdp: number) {
  return {
    name: "Totals" as const,
    updatedAt: new Date().toISOString(),
    odds: [{ over, under, hdp }],
  };
}

// ── Event 1: LIVE — Los Angeles Lakers @ Boston Celtics ─────────────────────

const event1 = makeEvent({
  id: "dev-1",
  home: "Boston Celtics",
  away: "Los Angeles Lakers",
  homeId: 2,
  awayId: 13,
  date: hoursFromNow(-1.5), // started 1.5h ago
  status: "live",
});

const bookmakers1 = {
  DraftKings: {
    url: "https://draftkings.com",
    markets: [
      mlMarket("1.55", "2.50"),
      spreadMarket("1.91", "1.91", -5.5),
      totalsMarket("1.90", "1.90", 221.5),
    ],
  },
  FanDuel: {
    url: "https://fanduel.com",
    markets: [
      mlMarket("1.57", "2.45"),
      spreadMarket("1.93", "1.89", -5.5),
      totalsMarket("1.91", "1.91", 222.0),
    ],
  },
  BetMGM: {
    url: "https://betmgm.com",
    markets: [
      mlMarket("1.53", "2.55"),
      spreadMarket("1.90", "1.92", -6.0),
      totalsMarket("1.88", "1.92", 221.5),
    ],
  },
  Caesars: {
    url: "https://caesars.com",
    markets: [
      mlMarket("1.56", "2.48"),
      spreadMarket("1.91", "1.91", -5.5),
    ],
  },
} as const;

// ── Event 2: TODAY — Golden State Warriors @ Cleveland Cavaliers ────────────

const event2 = makeEvent({
  id: "dev-2",
  home: "Cleveland Cavaliers",
  away: "Golden State Warriors",
  homeId: 5,
  awayId: 9,
  date: hoursFromNow(3), // 3 hours from now
  status: "upcoming",
});

const bookmakers2 = {
  DraftKings: {
    url: "https://draftkings.com",
    markets: [
      mlMarket("1.80", "2.05"),
      spreadMarket("1.91", "1.91", -2.5),
      totalsMarket("1.91", "1.91", 228.5),
    ],
  },
  FanDuel: {
    url: "https://fanduel.com",
    markets: [
      mlMarket("1.83", "2.00"),
      spreadMarket("1.90", "1.92", -2.0),
      totalsMarket("1.90", "1.90", 229.0),
    ],
  },
  BetMGM: {
    url: "https://betmgm.com",
    markets: [
      mlMarket("1.78", "2.10"),
      spreadMarket("1.92", "1.90", -3.0),
      totalsMarket("1.89", "1.93", 228.0),
    ],
  },
} as const;

// ── Event 3: TOMORROW — Miami Heat @ Chicago Bulls ──────────────────────────

const event3 = makeEvent({
  id: "dev-3",
  home: "Chicago Bulls",
  away: "Miami Heat",
  homeId: 4,
  awayId: 14,
  date: tomorrowAt(19), // tomorrow at 7:30 PM
  status: "upcoming",
});

const bookmakers3 = {
  DraftKings: {
    url: "https://draftkings.com",
    markets: [
      mlMarket("2.25", "1.67"),
      spreadMarket("1.91", "1.91", 3.5),
      totalsMarket("1.91", "1.91", 215.5),
    ],
  },
  FanDuel: {
    url: "https://fanduel.com",
    markets: [
      mlMarket("2.20", "1.69"),
      spreadMarket("1.90", "1.92", 3.0),
    ],
  },
  Caesars: {
    url: "https://caesars.com",
    markets: [
      mlMarket("2.30", "1.65"),
      spreadMarket("1.92", "1.90", 4.0),
      totalsMarket("1.90", "1.90", 216.0),
    ],
  },
} as const;

// ── Consolidated events ─────────────────────────────────────────────────────

export const DEV_EVENTS: ConsolidatedOddsEvent[] = [
  { event: event1 as never, bookmakers: bookmakers1 as never, lastUpdated: Date.now() },
  { event: event2 as never, bookmakers: bookmakers2 as never, lastUpdated: Date.now() },
  { event: event3 as never, bookmakers: bookmakers3 as never, lastUpdated: Date.now() },
];

// ── Value bet on Event 2 (Warriors ML on BetMGM — slight +EV) ──────────────

export const DEV_VALUE_BETS: ValueBet[] = [
  {
    eventId: "dev-2",
    bookmaker: "BetMGM",
    market: "ML",
    outcome: "away",
    odds: 2.10,
    fairOdds: 2.02,
    valuePercentage: 3.8,
  },
];

// ── Arb bet on Event 3 (Heat/Bulls totals) ──────────────────────────────────

export const DEV_ARB_BETS: ArbitrageBet[] = [
  {
    eventId: "dev-2",
    market: "Spread",
    marketLine: -2.5,
    profitPercentage: 0.9,
    legs: [
      { outcome: "home", bookmaker: "FanDuel", odds: 1.92, stake: 510 },
      { outcome: "away", bookmaker: "BetMGM", odds: 1.90, stake: 490 },
    ],
  },
  {
    eventId: "dev-3",
    market: "Totals",
    marketLine: 215.5,
    profitPercentage: 1.2,
    legs: [
      { outcome: "over", bookmaker: "DraftKings", odds: 1.91, stake: 524 },
      { outcome: "under", bookmaker: "Caesars", odds: 1.90, stake: 476 },
    ],
  },
];

// ── Lookup helpers (used by API routes) ─────────────────────────────────────

export function isDevEvent(eventId: string): boolean {
  return eventId.startsWith("dev-");
}

export function getDevEvent(eventId: string): ConsolidatedOddsEvent | null {
  return DEV_EVENTS.find((e) => String(e.event.id) === eventId) ?? null;
}

export function getDevValueBets(): ValueBet[] {
  return DEV_VALUE_BETS;
}

export function getDevArbBets(): ArbitrageBet[] {
  return DEV_ARB_BETS;
}
