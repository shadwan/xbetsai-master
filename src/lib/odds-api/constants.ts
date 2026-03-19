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
  "Bet365",
  "DraftKings",
  "FanDuel",
  "Unibet",
  "BetMGM",
] as const;

export const BOOKMAKERS_PARAM = BOOKMAKERS.join(",");

export type BookmakerName = (typeof BOOKMAKERS)[number];

// ── Sports & Leagues ────────────────────────────────────────────────────────

export const SPORTS = [
  { displayName: "NFL", sportSlug: "american-football", leagueSlug: "usa-nfl", season: "Sep-Feb" },
  { displayName: "NBA", sportSlug: "basketball", leagueSlug: "usa-nba", season: "Oct-Jun" },
  { displayName: "MLB", sportSlug: "baseball", leagueSlug: "usa-mlb", season: "Mar-Nov" },
  { displayName: "NHL", sportSlug: "ice-hockey", leagueSlug: "usa-nhl", season: "Oct-Jun" },
  { displayName: "CFB", sportSlug: "american-football", leagueSlug: "usa-ncaaf", season: "Aug-Jan" },
  { displayName: "CBB", sportSlug: "basketball", leagueSlug: "usa-ncaa-division-i-national-championship", season: "Nov-Apr" },
] as const satisfies readonly SportConfig[];

export type LeagueSlug = (typeof SPORTS)[number]["leagueSlug"];

// ── Season helpers ──────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/** Check if a given month (1-12) falls within a "Mon-Mon" season range. */
export function isInSeason(season: string, now = new Date()): boolean {
  const [startStr, endStr] = season.split("-");
  const start = MONTH_MAP[startStr];
  const end = MONTH_MAP[endStr];
  if (!start || !end) return true; // fallback: assume in-season
  const month = now.getMonth() + 1; // 1-indexed
  if (start <= end) {
    // e.g. Mar-Nov
    return month >= start && month <= end;
  }
  // Wraps around year, e.g. Sep-Feb
  return month >= start || month <= end;
}

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
  ODDS_WS: 5 * 60 * 1_000,            // 5 min — same as REST; WS data stays until next refresh
  ODDS_REST: 5 * 60 * 1_000,          // 5 min — REST-fetched odds (initial + fallback)
  VALUE_BETS: 30 * 1_000,            // 30 s  — must outlast 15 s poll interval
  ARB_BETS: 30 * 1_000,              // 30 s  — must outlast 15 s poll interval
  PROPS: 30 * 1_000,                 // 30 s  — on-demand, user-triggered
  HISTORICAL: 5 * 60 * 1_000,        // 5 min — doesn't change once recorded
  MOVEMENT: 10 * 60 * 1_000,         // 10 min — odds movement refresh
  PARTICIPANTS: 24 * 60 * 60 * 1_000, // 24 h — daily refresh sufficient
} as const;

// ── Poll intervals (milliseconds) ──────────────────────────────────────────

export const POLL_INTERVAL = {
  EVENTS: 60 * 1_000,          // 60 s  — moderate refresh
  ODDS: 4 * 60 * 1_000,        // 4 min — refresh before 5-min TTL expires
  ODDS_DELTA: 15 * 1_000,      // 15 s  — delta poller via /v3/odds/updated
  VALUE_BETS: 15 * 1_000,      // 15 s  — time-sensitive but don't hammer API
  ARB_BETS: 15 * 1_000,        // 15 s  — same reasoning
} as const;

// ── Delta poller: sport slug → API sport name mapping ──────────────────────
// The /v3/odds/updated endpoint requires a capitalised sport name.
export const SPORT_SLUG_TO_API_NAME: Record<string, string> = {
  "basketball": "Basketball",
  "american-football": "American Football",
  "baseball": "Baseball",
  "ice-hockey": "Ice Hockey",
};

/**
 * Returns deduplicated API sport names for leagues that are both
 * in-season AND have active events in the cache.
 */
export function getActiveDeltaSports(activeSports: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const s of SPORTS) {
    // Skip if no cached events for this league
    if (!activeSports.has(s.leagueSlug)) continue;
    // Skip if out of season
    if (!isInSeason(s.season)) continue;
    // Dedupe by sport slug (NBA + CBB both map to "Basketball")
    const apiName = SPORT_SLUG_TO_API_NAME[s.sportSlug];
    if (!apiName || seen.has(apiName)) continue;
    seen.add(apiName);
    result.push(apiName);
  }

  return result;
}
