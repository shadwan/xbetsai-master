/**
 * Dummy fixtures for the landing page showcase.
 * 3 events across different sports: NBA (live, +EV), NFL (today, surebet), MLB (today, props).
 * Uses real team names so TeamLogo resolves correctly.
 */

import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";
import type { ValueBet, ArbitrageBet } from "odds-api-io";

// ── Time helpers ────────────────────────────────────────────────────────────

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

// ── Event builder ───────────────────────────────────────────────────────────

function makeEvent(opts: {
  id: string;
  home: string;
  away: string;
  homeId: number;
  awayId: number;
  sport: string;
  leagueSlug: string;
  leagueName: string;
  date: string;
  status: "live" | "upcoming";
}) {
  return {
    id: opts.id,
    sport: opts.sport,
    league: { slug: opts.leagueSlug, name: opts.leagueName },
    leagueId: opts.leagueSlug,
    startTime: opts.date,
    date: opts.date,
    status: opts.status,
    home: opts.home,
    away: opts.away,
    homeParticipant: { id: opts.homeId, name: opts.home },
    awayParticipant: { id: opts.awayId, name: opts.away },
  };
}

// ── Market builders ─────────────────────────────────────────────────────────

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

// ── Event 1: LIVE NBA — Los Angeles Lakers @ Boston Celtics (+EV) ───────────

const event1 = makeEvent({
  id: "landing-1",
  home: "Boston Celtics",
  away: "Los Angeles Lakers",
  homeId: 2,
  awayId: 13,
  sport: "basketball",
  leagueSlug: "usa-nba",
  leagueName: "NBA",
  date: hoursFromNow(-1),
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
    ],
  },
  BetMGM: {
    url: "https://betmgm.com",
    markets: [
      mlMarket("1.53", "2.60"),
      spreadMarket("1.90", "1.92", -6.0),
    ],
  },
} as const;

// ── Event 2: TODAY NFL — Dallas Cowboys @ Philadelphia Eagles (surebet) ─────

const event2 = makeEvent({
  id: "landing-2",
  home: "Philadelphia Eagles",
  away: "Dallas Cowboys",
  homeId: 21,
  awayId: 6,
  sport: "american-football",
  leagueSlug: "usa-nfl",
  leagueName: "NFL",
  date: hoursFromNow(4),
  status: "upcoming",
});

const bookmakers2 = {
  DraftKings: {
    url: "https://draftkings.com",
    markets: [
      mlMarket("1.65", "2.30"),
      spreadMarket("1.91", "1.91", -3.5),
      totalsMarket("1.91", "1.91", 48.5),
    ],
  },
  FanDuel: {
    url: "https://fanduel.com",
    markets: [
      mlMarket("1.63", "2.35"),
      spreadMarket("1.92", "1.90", -3.0),
    ],
  },
  Caesars: {
    url: "https://caesars.com",
    markets: [
      mlMarket("1.67", "2.25"),
      spreadMarket("1.90", "1.92", -4.0),
      totalsMarket("1.90", "1.90", 49.0),
    ],
  },
} as const;

// ── Event 3: TODAY MLB — New York Yankees @ Los Angeles Dodgers (props) ─────

const event3 = makeEvent({
  id: "landing-3",
  home: "Los Angeles Dodgers",
  away: "New York Yankees",
  homeId: 19,
  awayId: 10,
  sport: "baseball",
  leagueSlug: "usa-mlb",
  leagueName: "MLB",
  date: hoursFromNow(6),
  status: "upcoming",
});

const bookmakers3 = {
  DraftKings: {
    url: "https://draftkings.com",
    markets: [
      mlMarket("1.75", "2.15"),
      spreadMarket("1.87", "1.95", -1.5),
      totalsMarket("1.91", "1.91", 8.5),
    ],
  },
  BetMGM: {
    url: "https://betmgm.com",
    markets: [
      mlMarket("1.72", "2.20"),
      totalsMarket("1.88", "1.92", 8.5),
    ],
  },
} as const;

// ── Consolidated events ─────────────────────────────────────────────────────

export const LANDING_EVENTS: ConsolidatedOddsEvent[] = [
  { event: event1 as never, bookmakers: bookmakers1 as never, lastUpdated: Date.now() },
  { event: event2 as never, bookmakers: bookmakers2 as never, lastUpdated: Date.now() },
  { event: event3 as never, bookmakers: bookmakers3 as never, lastUpdated: Date.now() },
];

// ── Value bet on Event 1 (Lakers ML on BetMGM — +EV) ───────────────────────

export const LANDING_VALUE_BETS: ValueBet[] = [
  {
    eventId: "landing-1",
    bookmaker: "BetMGM",
    market: "ML",
    outcome: "away",
    odds: 2.60,
    fairOdds: 2.48,
    valuePercentage: 4.8,
  },
  {
    eventId: "landing-3",
    bookmaker: "DraftKings",
    market: "Player Props Strikeouts O/U",
    outcome: "over",
    odds: 1.95,
    fairOdds: 1.87,
    valuePercentage: 4.3,
  },
];

// ── Arb bet on Event 2 (Cowboys/Eagles spread) ─────────────────────────────

export const LANDING_ARB_BETS: ArbitrageBet[] = [
  {
    eventId: "landing-2",
    market: "Spread",
    marketLine: -3.5,
    profitPercentage: 1.1,
    legs: [
      { outcome: "home", bookmaker: "FanDuel", odds: 1.92, stake: 510 },
      { outcome: "away", bookmaker: "Caesars", odds: 1.92, stake: 490 },
    ],
  },
];
