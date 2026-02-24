// ---------------------------------------------------------------------------
// Odds-API.io — configuration constants
// ---------------------------------------------------------------------------

export type SportConfig = {
  readonly displayName: string;
  readonly sportSlug: string;
  readonly leagueSlug: string;
  readonly season: string;
};

// ── Endpoints ───────────────────────────────────────────────────────────────

export const API_BASE = "https://api.odds-api.io/v3" as const;
export const WS_URL = "wss://api.odds-api.io/v3/ws" as const;

// ── Bookmakers ──────────────────────────────────────────────────────────────

// TODO: verify exact display names via GET /v3/bookmakers
export const BOOKMAKERS = [
  "FanDuel",
  "BetMGM",
  "Bet365",
  "Caesars",
  "DraftKings",
] as const;

export const BOOKMAKERS_PARAM = BOOKMAKERS.join(",");

export type BookmakerName = (typeof BOOKMAKERS)[number];

// ── Sports & Leagues ────────────────────────────────────────────────────────

export const SPORTS = [
  { displayName: "NFL", sportSlug: "american-football", leagueSlug: "usa-nfl", season: "Sep-Feb" },
  { displayName: "NBA", sportSlug: "basketball", leagueSlug: "usa-nba", season: "Oct-Jun" },
  { displayName: "MLB", sportSlug: "baseball", leagueSlug: "usa-mlb", season: "Mar-Nov" },
  { displayName: "NHL", sportSlug: "ice-hockey", leagueSlug: "usa-nhl", season: "Oct-Jun" },
  { displayName: "NCAAF", sportSlug: "american-football", leagueSlug: "usa-ncaaf", season: "Aug-Jan" },
  { displayName: "NCAAMB", sportSlug: "basketball", leagueSlug: "usa-ncaab", season: "Nov-Apr" },
] as const satisfies readonly SportConfig[];

export type LeagueSlug = (typeof SPORTS)[number]["leagueSlug"];

// ── WebSocket filters ───────────────────────────────────────────────────────

export const WS_MARKETS = "ML,Spread,Totals" as const;

export const WS_SPORTS = [
  "american-football",
  "basketball",
  "baseball",
  "ice-hockey",
] as const;

export type SportSlug = (typeof WS_SPORTS)[number];

// ── Cache TTLs (milliseconds) ───────────────────────────────────────────────

export const CACHE_TTL = {
  SPORTS: 2 * 60 * 60 * 1_000,       // 2 h  — rarely changes
  LEAGUES: 2 * 60 * 60 * 1_000,      // 2 h  — rarely changes
  EVENTS: 5 * 60 * 1_000,            // 5 min — pre-match events refresh periodically
  ODDS_WS: 30 * 1_000,               // 30 s  — safety TTL; WS refreshes continuously
  VALUE_BETS: 10 * 1_000,            // 10 s  — recalculated every 5 s by API, time-sensitive
  ARB_BETS: 10 * 1_000,              // 10 s  — same — time-sensitive
  PROPS: 30 * 1_000,                 // 30 s  — on-demand, user-triggered
  HISTORICAL: 5 * 60 * 1_000,        // 5 min — doesn't change once recorded
  PARTICIPANTS: 24 * 60 * 60 * 1_000, // 24 h — daily refresh sufficient
} as const;

// ── Poll intervals (milliseconds) ──────────────────────────────────────────

export const POLL_INTERVAL = {
  EVENTS: 60 * 1_000,     // 60 s  — moderate refresh
  VALUE_BETS: 15 * 1_000, // 15 s  — time-sensitive but don't hammer API
  ARB_BETS: 15 * 1_000,   // 15 s  — same reasoning
} as const;
