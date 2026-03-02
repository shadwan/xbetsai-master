/**
 * ESPN team ID and metadata lookup from the manifest.
 *
 * The manifest (public/logos/manifest.json) has this structure:
 * { "nba": { "atl": { id, displayName, location, nickname, color, alternateColor, ... }, ... }, ... }
 *
 * The `id` field is the ESPN team ID used in their public API.
 */

import manifest from "@/public/logos/manifest.json";

// ── Types ────────────────────────────────────────────────────────────────────

export type TeamMeta = {
  id: string;
  displayName: string;
  location: string;
  nickname: string;
  color: string | null;
  alternateColor: string | null;
};

type ManifestTeam = {
  id: string;
  displayName: string;
  shortName: string;
  abbreviation: string;
  location: string;
  nickname: string;
  color: string | null;
  alternateColor: string | null;
};

type ManifestLeague = Record<string, ManifestTeam>;
type Manifest = Record<string, ManifestLeague>;

const teams = manifest as unknown as Manifest;

// ── League slug → manifest key ──────────────────────────────────────────────

const LEAGUE_TO_MANIFEST: Record<string, string> = {
  "usa-nba": "nba",
  "usa-nfl": "nfl",
  "usa-mlb": "mlb",
  "usa-nhl": "nhl",
  "usa-ncaaf": "ncaaf",
  "usa-ncaab": "ncaamb",
  "usa-ncaa-regular-season": "ncaamb",
};

// ── Lookup ───────────────────────────────────────────────────────────────────

function findTeam(league: string, teamName: string): ManifestTeam | null {
  const folder = LEAGUE_TO_MANIFEST[league];
  if (!folder) return null;
  const leagueTeams = teams[folder];
  if (!leagueTeams) return null;

  const needle = teamName.toLowerCase().trim();

  // 1. Direct key match
  if (leagueTeams[needle]) return leagueTeams[needle];

  // 2. Abbreviation match
  for (const team of Object.values(leagueTeams)) {
    if (team.abbreviation.toLowerCase() === needle) return team;
  }

  // 3. Exact field match
  for (const team of Object.values(leagueTeams)) {
    if (
      team.displayName.toLowerCase() === needle ||
      team.shortName.toLowerCase() === needle ||
      team.nickname.toLowerCase() === needle ||
      team.location.toLowerCase() === needle
    ) {
      return team;
    }
  }

  // 4. Fuzzy substring
  for (const team of Object.values(leagueTeams)) {
    const dn = team.displayName.toLowerCase();
    if (dn.includes(needle) || needle.includes(dn)) return team;
  }

  // 5. Partial word match
  for (const team of Object.values(leagueTeams)) {
    const sn = team.shortName.toLowerCase();
    const nn = team.nickname.toLowerCase();
    if (needle.includes(sn) || needle.includes(nn)) return team;
  }

  return null;
}

// ── Exports ──────────────────────────────────────────────────────────────────

/**
 * Get the ESPN team ID from the manifest.
 * Takes our odds API league slug (e.g., "usa-nba") and team display name
 * (e.g., "Golden State Warriors"), returns the ESPN id field.
 */
export function getEspnTeamId(
  leagueSlug: string,
  teamName: string,
): string | null {
  const team = findTeam(leagueSlug, teamName);
  return team?.id ?? null;
}

/**
 * Get full team metadata from the manifest.
 * Returns { id, displayName, location, nickname, color, alternateColor }.
 */
export function getTeamMeta(
  leagueSlug: string,
  teamName: string,
): TeamMeta | null {
  const team = findTeam(leagueSlug, teamName);
  if (!team) return null;
  return {
    id: team.id,
    displayName: team.displayName,
    location: team.location,
    nickname: team.nickname,
    color: team.color,
    alternateColor: team.alternateColor,
  };
}
