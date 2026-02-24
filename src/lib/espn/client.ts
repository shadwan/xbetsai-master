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

export { ESPN_LEAGUES };
