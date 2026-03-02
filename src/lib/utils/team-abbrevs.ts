/**
 * Team abbreviation lookups — maps display names to abbreviations.
 * Built from public/logos/manifest.json data.
 *
 * Two abbreviation systems:
 * - ESPN abbreviations (used for PNG logo file paths)
 * - SVG package abbreviations (used for react-nba-logos etc.)
 */

import manifest from "@/public/logos/manifest.json";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── ESPN → SVG package abbreviation mapping ──────────────────────────────────
// These handle mismatches between ESPN's abbreviations and what the
// react-*-logos packages export.

const ESPN_TO_SVG: Record<string, Record<string, string>> = {
  "usa-nba": {
    GS: "GSW",
    NO: "NOP",
    NY: "NYK",
    SA: "SAS",
    UTAH: "UTA",
    WSH: "WAS",
  },
  "usa-nfl": {
    WSH: "WAS",
  },
  "usa-mlb": {
    ATH: "OAK",
    KC: "KAN",
    WSH: "WAS",
  },
  "usa-nhl": {
    NJ: "NJD",
    SJ: "SJS",
    TB: "TBL",
    LA: "LAK",
  },
};

// ── League slug → manifest key ──────────────────────────────────────────────

const LEAGUE_TO_FOLDER: Record<string, string> = {
  "usa-nba": "nba",
  "usa-nfl": "nfl",
  "usa-mlb": "mlb",
  "usa-nhl": "nhl",
  "usa-ncaaf": "ncaaf",
  "usa-ncaab": "ncaamb",
  "usa-ncaa-regular-season": "ncaamb",
};

// ── Lookup helpers ───────────────────────────────────────────────────────────

function findTeamInManifest(
  league: string,
  teamName: string
): ManifestTeam | null {
  const folder = LEAGUE_TO_FOLDER[league];
  if (!folder) return null;
  const leagueTeams = teams[folder];
  if (!leagueTeams) return null;

  const needle = teamName.toLowerCase().trim();

  // 1. Direct key match (abbreviation lowercase = manifest key)
  if (leagueTeams[needle]) return leagueTeams[needle];

  // 2. Match by abbreviation (case-insensitive)
  for (const team of Object.values(leagueTeams)) {
    if (team.abbreviation.toLowerCase() === needle) return team;
  }

  // 3. Exact match on displayName, shortName, nickname, location
  for (const team of Object.values(leagueTeams)) {
    const dn = team.displayName.toLowerCase();
    const sn = team.shortName.toLowerCase();
    const nn = team.nickname.toLowerCase();
    const loc = team.location.toLowerCase();
    if (dn === needle || sn === needle || nn === needle || loc === needle) {
      return team;
    }
  }

  // 4. Fuzzy: needle is substring of displayName, or displayName contains needle
  for (const team of Object.values(leagueTeams)) {
    const dn = team.displayName.toLowerCase();
    if (dn.includes(needle) || needle.includes(dn)) return team;
  }

  // 5. Partial: any word match against shortName or nickname
  for (const team of Object.values(leagueTeams)) {
    const sn = team.shortName.toLowerCase();
    const nn = team.nickname.toLowerCase();
    if (needle.includes(sn) || needle.includes(nn)) return team;
  }

  return null;
}

/**
 * Get the ESPN abbreviation for a team (used for PNG file paths).
 * Returns uppercase like "ATL", "GS", "LAL".
 */
export function getTeamAbbreviation(
  league: string,
  teamName: string
): string | null {
  const team = findTeamInManifest(league, teamName);
  return team?.abbreviation ?? null;
}

/**
 * Get the SVG package abbreviation for a team.
 * Applies ESPN→SVG mapping for mismatched abbreviations.
 * Returns uppercase like "ATL", "GSW", "LAL".
 */
export function getSvgAbbreviation(
  league: string,
  teamName: string
): string | null {
  const team = findTeamInManifest(league, teamName);
  if (!team) return null;

  const espnAbbr = team.abbreviation;
  const svgMap = ESPN_TO_SVG[league];
  if (svgMap && svgMap[espnAbbr]) {
    return svgMap[espnAbbr];
  }
  return espnAbbr;
}

/**
 * Get team primary color (hex) from manifest.
 */
export function getTeamColor(
  league: string,
  teamName: string
): string | null {
  const team = findTeamInManifest(league, teamName);
  return team?.color ?? null;
}

/**
 * Get the folder name for a league slug.
 * "usa-nba" → "nba", "usa-ncaab" → "ncaamb"
 */
export function getLeagueFolder(league: string): string | null {
  return LEAGUE_TO_FOLDER[league] ?? null;
}

/**
 * Get team location and nickname separately.
 * "Philadelphia 76ers" → { location: "Philadelphia", nickname: "76ers" }
 */
export function getTeamParts(
  league: string,
  teamName: string,
): { location: string; nickname: string } {
  const team = findTeamInManifest(league, teamName);
  if (team) {
    return { location: team.location, nickname: team.nickname };
  }
  // Fallback: split on last space
  const parts = teamName.trim().split(/\s+/);
  if (parts.length > 1) {
    const nickname = parts[parts.length - 1];
    const location = parts.slice(0, -1).join(" ");
    return { location, nickname };
  }
  return { location: "", nickname: teamName };
}

export { LEAGUE_TO_FOLDER };
