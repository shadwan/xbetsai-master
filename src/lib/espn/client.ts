/**
 * ESPN public API client.
 *
 * ESPN's site API is free and requires no authentication.
 * Base: https://site.api.espn.com/apis/site/v2/sports
 *
 * NOTE: ESPN does not set CORS headers, so browser-side fetches will fail.
 * Use the /api/espn/team/[teamId] proxy route from client components.
 * This module is for server-side use only.
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// ── League slug → ESPN sport/league path ─────────────────────────────────────

const ESPN_LEAGUES: Record<string, { sport: string; league: string }> = {
  "usa-nba": { sport: "basketball", league: "nba" },
  "usa-nfl": { sport: "football", league: "nfl" },
  "usa-mlb": { sport: "baseball", league: "mlb" },
  "usa-nhl": { sport: "hockey", league: "nhl" },
  "usa-ncaaf": { sport: "football", league: "college-football" },
  "usa-ncaab": { sport: "basketball", league: "mens-college-basketball" },
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface TeamInfo {
  record: string | null;
  standing: string | null;
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Fetch team info (record + standing) from ESPN's public API.
 * Server-side only — ESPN blocks CORS for browser requests.
 */
export async function fetchTeamInfo(
  leagueSlug: string,
  espnTeamId: string,
): Promise<TeamInfo> {
  const espn = ESPN_LEAGUES[leagueSlug];
  if (!espn) return { record: null, standing: null };

  const url = `${ESPN_BASE}/${espn.sport}/${espn.league}/teams/${espnTeamId}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5_000),
  });

  if (!res.ok) return { record: null, standing: null };

  const json = await res.json();
  const team = json?.team;
  if (!team) return { record: null, standing: null };

  // Record: first item in record.items with type "total"
  const recordItems = team.record?.items as
    | Array<{ summary?: string; type?: string }>
    | undefined;
  const totalRecord =
    recordItems?.find((r) => r.type === "total")?.summary ??
    recordItems?.[0]?.summary ??
    null;

  // Standing summary
  const standing: string | null = team.standingSummary ?? null;

  return { record: totalRecord, standing };
}

// ── Prediction types ─────────────────────────────────────────────────────────

export interface GamePrediction {
  homeWinProb: number; // 0–100
  awayWinProb: number; // 0–100
}

// ── Prediction fetcher ───────────────────────────────────────────────────────

/**
 * Find the ESPN event ID from the scoreboard by matching team IDs,
 * then fetch the summary endpoint which contains predictor data.
 * Returns null if no predictor data is available for this game.
 */
export async function fetchGamePrediction(
  leagueSlug: string,
  homeTeamId: string,
  awayTeamId: string,
): Promise<GamePrediction | null> {
  const espn = ESPN_LEAGUES[leagueSlug];
  if (!espn) return null;

  // Step 1: Fetch scoreboard to find the ESPN event ID for this matchup
  const scoreboardUrl = `${ESPN_BASE}/${espn.sport}/${espn.league}/scoreboard`;

  const scoreboardRes = await fetch(scoreboardUrl, {
    signal: AbortSignal.timeout(8_000),
  });

  if (!scoreboardRes.ok) return null;

  const scoreboardJson = await scoreboardRes.json();
  const events = scoreboardJson?.events as Array<Record<string, unknown>> | undefined;
  if (!events) return null;

  let espnEventId: string | null = null;

  for (const evt of events) {
    const competitions = evt.competitions as Array<Record<string, unknown>> | undefined;
    if (!competitions) continue;

    for (const comp of competitions) {
      const competitors = comp.competitors as
        | Array<{ id?: string; homeAway?: string; team?: { id?: string } }>
        | undefined;
      if (!competitors) continue;

      const homeComp = competitors.find(
        (c) => (c.id === homeTeamId || c.team?.id === homeTeamId) && c.homeAway === "home",
      );
      const awayComp = competitors.find(
        (c) => (c.id === awayTeamId || c.team?.id === awayTeamId) && c.homeAway === "away",
      );

      if (homeComp && awayComp) {
        espnEventId = evt.id as string;
        break;
      }
    }
    if (espnEventId) break;
  }

  if (!espnEventId) return null;

  // Step 2: Fetch the summary endpoint which has predictor data
  const summaryUrl = `${ESPN_BASE}/${espn.sport}/${espn.league}/summary?event=${espnEventId}`;

  const summaryRes = await fetch(summaryUrl, {
    signal: AbortSignal.timeout(8_000),
  });

  if (!summaryRes.ok) return null;

  const summaryJson = await summaryRes.json();
  const predictor = summaryJson?.predictor as
    | { homeTeam?: { gameProjection?: string | number }; awayTeam?: { gameProjection?: string | number } }
    | undefined;

  if (!predictor) return null;

  const homeProj = predictor.homeTeam?.gameProjection != null
    ? parseFloat(String(predictor.homeTeam.gameProjection))
    : null;
  const awayProj = predictor.awayTeam?.gameProjection != null
    ? parseFloat(String(predictor.awayTeam.gameProjection))
    : null;

  if (homeProj == null && awayProj == null) return null;

  return {
    homeWinProb: homeProj ?? (100 - (awayProj ?? 50)),
    awayWinProb: awayProj ?? (100 - (homeProj ?? 50)),
  };
}

// ── Roster types ────────────────────────────────────────────────────────────

export interface RosterPlayer {
  id: string;
  name: string;
  shortName: string;
  jersey: string;
  position: string;
  headshotUrl: string | null;
  starter: boolean;
  active: boolean;
}

export interface GameRosterTeam {
  name: string;
  abbreviation: string;
  players: RosterPlayer[];
}

export interface GameRoster {
  homeTeam: GameRosterTeam;
  awayTeam: GameRosterTeam;
}

// ── Roster fetcher ──────────────────────────────────────────────────────────

/**
 * Fetch a single team's roster from ESPN's team roster endpoint.
 * Works for all game states (scheduled, live, completed).
 */
async function fetchTeamRoster(
  sport: string,
  league: string,
  teamId: string,
): Promise<GameRosterTeam | null> {
  const url = `${ESPN_BASE}/${sport}/${league}/teams/${teamId}/roster`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;

  const json = await res.json();

  const team = json?.team as
    | { displayName?: string; abbreviation?: string }
    | undefined;

  const athletes = json?.athletes as
    | Array<{
        id?: string;
        displayName?: string;
        shortName?: string;
        jersey?: string;
        headshot?: { href?: string };
        position?: { abbreviation?: string };
        status?: { type?: string };
      }>
    | undefined;

  if (!athletes) return null;

  const players: RosterPlayer[] = athletes
    .filter((a) => a.id)
    .map((a) => ({
      id: a.id!,
      name: a.displayName ?? "Unknown",
      shortName: a.shortName ?? a.displayName ?? "Unknown",
      jersey: a.jersey ?? "",
      position: a.position?.abbreviation ?? "",
      headshotUrl: a.headshot?.href ?? null,
      starter: false, // roster endpoint doesn't have starter info
      active: a.status?.type === "active",
    }));

  return {
    name: team?.displayName ?? "Unknown",
    abbreviation: team?.abbreviation ?? "",
    players,
  };
}

/**
 * Fetch full game roster for both teams using ESPN's team roster endpoint.
 * Works for all game states — no dependency on boxscore data.
 */
export async function fetchGameRoster(
  leagueSlug: string,
  homeTeamId: string,
  awayTeamId: string,
): Promise<GameRoster | null> {
  const espn = ESPN_LEAGUES[leagueSlug];
  if (!espn) return null;

  const [homeRoster, awayRoster] = await Promise.all([
    fetchTeamRoster(espn.sport, espn.league, homeTeamId),
    fetchTeamRoster(espn.sport, espn.league, awayTeamId),
  ]);

  if (!homeRoster || !awayRoster) return null;

  return {
    homeTeam: homeRoster,
    awayTeam: awayRoster,
  };
}

export { ESPN_LEAGUES };
