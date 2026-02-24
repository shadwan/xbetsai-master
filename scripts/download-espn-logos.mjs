#!/usr/bin/env node

/**
 * download-espn-logos.mjs
 * 
 * Downloads team logos from ESPN's public API for all sports supported by xBetsAI.
 * 
 * Output structure:
 *   public/logos/
 *     ├── nba/
 *     │   ├── atl.png          (default/light logo)
 *     │   ├── atl-dark.png     (dark variant)
 *     │   ├── bos.png
 *     │   ├── bos-dark.png
 *     │   └── ...
 *     ├── nfl/
 *     ├── mlb/
 *     ├── nhl/
 *     ├── ncaaf/
 *     └── ncaamb/
 * 
 * Also generates a manifest JSON file at public/logos/manifest.json with metadata:
 *   { league: { abbreviation: { displayName, color, alternateColor, logo, logoDark } } }
 * 
 * Usage:
 *   node scripts/download-espn-logos.mjs
 *   node scripts/download-espn-logos.mjs --output ./public/logos
 *   node scripts/download-espn-logos.mjs --dark-only   (skip light logos, only dark)
 *   node scripts/download-espn-logos.mjs --dry-run     (just print what would be downloaded)
 * 
 * Requires: Node.js 18+ (uses native fetch)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ─── Config ───────────────────────────────────────────────────────────────────

const ESPN_TEAMS_API = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * Maps our league slugs to ESPN's sport/league path structure.
 * These are the 6 sports xBetsAI supports via Odds-API.io.
 */
const LEAGUES = [
  { slug: "nba",    espnSport: "basketball", espnLeague: "nba",                       display: "NBA" },
  { slug: "nfl",    espnSport: "football",   espnLeague: "nfl",                       display: "NFL" },
  { slug: "mlb",    espnSport: "baseball",   espnLeague: "mlb",                       display: "MLB" },
  { slug: "nhl",    espnSport: "hockey",     espnLeague: "nhl",                       display: "NHL" },
  { slug: "ncaaf",  espnSport: "football",   espnLeague: "college-football",          display: "NCAAF" },
  { slug: "ncaamb", espnSport: "basketball", espnLeague: "mens-college-basketball",   display: "NCAAMB" },
];

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outputDir = args.includes("--output")
  ? args[args.indexOf("--output") + 1]
  : "./public/logos";
const darkOnly = args.includes("--dark-only");
const dryRun = args.includes("--dry-run");
const lightOnly = args.includes("--light-only");
const help = args.includes("--help") || args.includes("-h");

if (help) {
  console.log(`
Usage: node scripts/download-espn-logos.mjs [options]

Options:
  --output <dir>   Output directory (default: ./public/logos)
  --dark-only      Only download dark variant logos
  --light-only     Only download default/light logos
  --dry-run        Print download plan without downloading
  --help, -h       Show this help message
`);
  process.exit(0);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchTeams(espnSport, espnLeague) {
  const url = `${ESPN_TEAMS_API}/${espnSport}/${espnLeague}/teams?limit=200`;
  console.log(`  Fetching: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ESPN API error ${res.status}: ${res.statusText} for ${espnLeague}`);
  }

  const data = await res.json();

  // ESPN response: { sports: [{ leagues: [{ teams: [{ team: {...} }] }] }] }
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return teams.map((t) => t.team);
}

function findLogo(logos, ...relTags) {
  // Find a logo whose rel array includes ALL specified tags
  return logos?.find((logo) =>
    relTags.every((tag) => logo.rel?.includes(tag))
  );
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`    ⚠ Failed to download: ${url} (${res.status})`);
    return false;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filepath, buffer);
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🏟️  xBetsAI ESPN Logo Downloader\n");
  console.log(`Output: ${outputDir}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : darkOnly ? "dark only" : lightOnly ? "light only" : "default + dark"}\n`);

  const manifest = {};
  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const league of LEAGUES) {
    console.log(`\n📦 ${league.display} (${league.slug})`);
    console.log("─".repeat(40));

    let teams;
    try {
      teams = await fetchTeams(league.espnSport, league.espnLeague);
    } catch (err) {
      console.error(`  ✗ Failed to fetch teams: ${err.message}`);
      continue;
    }

    console.log(`  Found ${teams.length} teams`);

    const leagueDir = join(outputDir, league.slug);
    if (!dryRun && !existsSync(leagueDir)) {
      await mkdir(leagueDir, { recursive: true });
    }

    manifest[league.slug] = {};

    for (const team of teams) {
      const abbr = team.abbreviation?.toLowerCase();
      if (!abbr) {
        console.warn(`  ⚠ Skipping team with no abbreviation: ${team.displayName}`);
        totalSkipped++;
        continue;
      }

      const defaultLogo = findLogo(team.logos, "full", "default");
      const darkLogo = findLogo(team.logos, "full", "dark");

      // Build manifest entry
      manifest[league.slug][abbr] = {
        id: team.id,
        displayName: team.displayName,
        shortName: team.shortDisplayName,
        abbreviation: team.abbreviation,
        location: team.location,
        nickname: team.name,
        color: team.color ? `#${team.color}` : null,
        alternateColor: team.alternateColor ? `#${team.alternateColor}` : null,
        logo: defaultLogo?.href ?? null,
        logoDark: darkLogo?.href ?? null,
        localLogo: `/${league.slug}/${abbr}.png`,
        localLogoDark: `/${league.slug}/${abbr}-dark.png`,
      };

      if (dryRun) {
        console.log(`  ${team.abbreviation.padEnd(5)} ${team.displayName}`);
        if (!darkOnly && defaultLogo) console.log(`         → ${abbr}.png`);
        if (!lightOnly && darkLogo) console.log(`         → ${abbr}-dark.png`);
        continue;
      }

      // Download default logo
      if (!darkOnly && defaultLogo?.href) {
        const filepath = join(leagueDir, `${abbr}.png`);
        const ok = await downloadImage(defaultLogo.href, filepath);
        if (ok) {
          totalDownloaded++;
          process.stdout.write(`  ✓ ${team.abbreviation} `);
        } else {
          totalFailed++;
        }
      }

      // Download dark logo
      if (!lightOnly && darkLogo?.href) {
        const filepath = join(leagueDir, `${abbr}-dark.png`);
        const ok = await downloadImage(darkLogo.href, filepath);
        if (ok) {
          totalDownloaded++;
        } else {
          totalFailed++;
        }
      }

      // Be nice to ESPN's servers
      await sleep(50);
    }

    console.log(); // newline after league
  }

  // Write manifest
  if (!dryRun) {
    const manifestPath = join(outputDir, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n📄 Manifest written to ${manifestPath}`);
  }

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 Summary");
  console.log("═".repeat(50));

  const totalTeams = Object.values(manifest).reduce(
    (sum, league) => sum + Object.keys(league).length,
    0
  );
  console.log(`  Leagues:    ${LEAGUES.length}`);
  console.log(`  Teams:      ${totalTeams}`);
  if (!dryRun) {
    console.log(`  Downloaded: ${totalDownloaded} logos`);
    console.log(`  Failed:     ${totalFailed}`);
    console.log(`  Skipped:    ${totalSkipped}`);
  }
  console.log();

  // Generate a TypeScript helper module
  if (!dryRun) {
    const tsPath = join(outputDir, "team-logos.ts");
    const tsContent = `/**
 * Auto-generated by scripts/download-espn-logos.mjs
 * Generated: ${new Date().toISOString()}
 * 
 * Maps team display names to their local logo paths.
 * Usage: import { getTeamLogo } from "@/public/logos/team-logos";
 */

import manifest from "./manifest.json";

type LeagueSlug = ${LEAGUES.map((l) => `"${l.slug}"`).join(" | ")};

interface TeamInfo {
  id: string;
  displayName: string;
  shortName: string;
  abbreviation: string;
  location: string;
  nickname: string;
  color: string | null;
  alternateColor: string | null;
  logo: string | null;
  logoDark: string | null;
  localLogo: string;
  localLogoDark: string;
}

type Manifest = Record<LeagueSlug, Record<string, TeamInfo>>;

const teams = manifest as unknown as Manifest;

/**
 * Get the local logo path for a team.
 * @param league - League slug (nba, nfl, mlb, nhl, ncaaf, ncaamb)
 * @param teamName - Team display name (e.g., "Atlanta Hawks") or abbreviation (e.g., "ATL")
 * @param dark - Use dark variant (default: true for dark theme apps)
 * @returns Local logo path like "/logos/nba/atl-dark.png" or null if not found
 */
export function getTeamLogo(
  league: LeagueSlug,
  teamName: string,
  dark = true
): string | null {
  const leagueTeams = teams[league];
  if (!leagueTeams) return null;

  // Try direct abbreviation lookup first
  const abbr = teamName.toLowerCase();
  if (leagueTeams[abbr]) {
    const prefix = "/logos";
    return dark
      ? prefix + leagueTeams[abbr].localLogoDark
      : prefix + leagueTeams[abbr].localLogo;
  }

  // Fuzzy match by display name, short name, location, or nickname
  const needle = teamName.toLowerCase();
  for (const [key, team] of Object.entries(leagueTeams)) {
    if (
      team.displayName.toLowerCase() === needle ||
      team.shortName.toLowerCase() === needle ||
      team.location.toLowerCase() === needle ||
      team.nickname.toLowerCase() === needle ||
      team.displayName.toLowerCase().includes(needle) ||
      needle.includes(team.shortName.toLowerCase())
    ) {
      const prefix = "/logos";
      return dark
        ? prefix + team.localLogoDark
        : prefix + team.localLogo;
    }
  }

  return null;
}

/**
 * Get team color (primary) for UI accents.
 */
export function getTeamColor(league: LeagueSlug, teamName: string): string | null {
  const leagueTeams = teams[league];
  if (!leagueTeams) return null;

  const abbr = teamName.toLowerCase();
  if (leagueTeams[abbr]) return leagueTeams[abbr].color;

  const needle = teamName.toLowerCase();
  for (const team of Object.values(leagueTeams)) {
    if (
      team.displayName.toLowerCase().includes(needle) ||
      needle.includes(team.shortName.toLowerCase())
    ) {
      return team.color;
    }
  }

  return null;
}

/**
 * Get all teams for a league.
 */
export function getLeagueTeams(league: LeagueSlug): TeamInfo[] {
  return Object.values(teams[league] ?? {});
}

export { teams as teamManifest };
export type { LeagueSlug, TeamInfo, Manifest };
`;
    await writeFile(tsPath, tsContent);
    console.log(`📝 TypeScript helper written to ${tsPath}`);
  }

  console.log("✅ Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
