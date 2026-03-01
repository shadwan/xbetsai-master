// ── Types ────────────────────────────────────────────────────────────────────

export interface PropLine {
  bookmaker: string;
  hdp: number;
  over: number;
  under: number;
}

export interface PlayerProp {
  propType: string;
  lines: PropLine[];
  consensusLine: number;
  bestOver: { bookmaker: string; odds: number } | null;
  bestUnder: { bookmaker: string; odds: number } | null;
  hasLineDiscrepancy: boolean;
  hasOddsDiscrepancy: boolean; // >0.15 decimal diff between best & worst
}

export interface ParsedPlayer {
  name: string;
  props: PlayerProp[];
  edgeCount: number; // number of props with any edge flag
}

export interface ParsedPropsData {
  categories: string[];
  players: ParsedPlayer[];
  byCategory: Record<string, ParsedPlayer[]>;
  totalCount: number;
  edgeCount: number; // total props across all players with an edge
}

// Legacy types kept for backward compat with PropsTable
export interface ParsedPlayerProp {
  playerName: string;
  propType: string;
  lines: PropLine[];
  consensusLine: number;
  bestOver: { bookmaker: string; odds: number } | null;
  bestUnder: { bookmaker: string; odds: number } | null;
  hasLineDiscrepancy: boolean;
}

export interface ParsedPropLine {
  playerName: string;
  line: number;
  bookmakerOdds: Record<string, { over: number; under: number }>;
  bestOver: { bookmaker: string; odds: number } | null;
  bestUnder: { bookmaker: string; odds: number } | null;
  lineDiscrepancy: boolean;
}

export interface ParsedPropMarket {
  statType: string;
  lines: ParsedPropLine[];
}

// ── Raw API types ───────────────────────────────────────────────────────────

interface RawOddsEntry {
  label: string;
  hdp?: number;
  over?: string;
  under?: string;
}

interface RawMarket {
  name: string;
  odds: RawOddsEntry[];
}

export interface RawPropsResponse {
  bookmakers: Record<string, RawMarket[]>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const OU_SUFFIX = /\s+O\/U$/i;
const ALL_PARENS = /\s*\([^)]*\)/g;

/**
 * Identify player-prop markets.  Two API shapes:
 *  1. name = "Player Props"           → label = "Name (PropType)"
 *  2. name = "Points O/U" / "Assists O/U" etc. → label = "Name (N) (line)"
 * We also accept "Player Props - Xxx" in case the API ever returns that.
 * Reject non-prop markets: ML, Spread, Totals, Alternative *, Team Total *, etc.
 */
function isPlayerPropMarket(name: string): boolean {
  if (/^Player Props/i.test(name)) return true;
  if (OU_SUFFIX.test(name)) return true;
  return false;
}

/**
 * Extract the prop-type category from the market+label.
 *  - "Player Props" + label "Name (Points)" → "Points"
 *  - "Player Props - Points" → "Points"
 *  - "Points O/U" → "Points"
 *  - "Assists & Rebounds O/U" → "Assists & Rebounds"
 */
function extractCategory(
  marketName: string,
  label: string,
): string {
  // Shape 2: "Points O/U" → strip O/U
  if (OU_SUFFIX.test(marketName)) {
    return marketName.replace(OU_SUFFIX, "").trim();
  }
  // Shape 1a: "Player Props - Points" → strip prefix
  const dashMatch = marketName.match(/^Player Props\s*-\s*(.+)/i);
  if (dashMatch) {
    return dashMatch[1].replace(OU_SUFFIX, "").trim();
  }
  // Shape 1b: "Player Props" with label "Name (PropType)"
  const parenMatch = label.match(/\(([^()]+)\)\s*$/);
  if (parenMatch) return parenMatch[1].trim();
  return "Other";
}

/**
 * Strip ALL parenthetical suffixes from a label to get the clean player name.
 * "Aaron Wiggins (Points)" → "Aaron Wiggins"
 * "Dominick Barlow (1) (8.5)" → "Dominick Barlow"
 */
function cleanPlayerName(label: string): string {
  return label.replace(ALL_PARENS, "").trim();
}

/** Title-case a category string so "Shots on Goal" and "Shots On Goal" merge. */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Normalize category aliases so bookmakers with different naming merge. */
const CATEGORY_ALIASES: Record<string, string> = {
  "Pts+Asts": "Points & Assists",
  "Pts+Rebs": "Points & Rebounds",
  "Pts+Rebs+Asts": "Points, Assists & Rebounds",
  "Rebs+Asts": "Rebounds & Assists",
  "3 Point FG": "Threes Made",
  "Double+Double": "Double Double",
  "Triple+Double": "Triple Double",
};

function normalizeCategory(cat: string): string {
  const titled = titleCase(cat);
  return CATEGORY_ALIASES[titled] ?? titled;
}

function findConsensusLine(lines: { hdp: number }[]): number {
  const freq = new Map<number, number>();
  for (const l of lines) {
    freq.set(l.hdp, (freq.get(l.hdp) ?? 0) + 1);
  }
  let best = lines[0]?.hdp ?? 0;
  let bestCount = 0;
  for (const [hdp, count] of freq) {
    if (count > bestCount) {
      best = hdp;
      bestCount = count;
    }
  }
  return best;
}

/** Abbreviate common bookmaker names */
const BK_ABBR: Record<string, string> = {
  DraftKings: "DK",
  FanDuel: "FD",
  BetMGM: "MGM",
  Caesars: "CS",
  "Caesars Sportsbook": "CS",
  Bet365: "365",
  bet365: "365",
  PointsBet: "PB",
  BetRivers: "BR",
  "Hard Rock Bet": "HRB",
  Bovada: "BOV",
  MyBookie: "MB",
  "MyBookie.ag": "MB",
  Pinnacle: "PIN",
  Unibet: "UNI",
  Betway: "BW",
  WynnBET: "WYNN",
  SuperBook: "SB",
  "ESPN BET": "ESPN",
};

export function abbreviateBookmaker(name: string): string {
  // Exact match first
  if (BK_ABBR[name]) return BK_ABBR[name];
  // Strip parenthetical suffixes like "(no latency)" and retry
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (BK_ABBR[stripped]) return BK_ABBR[stripped];
  return name;
}

// ── Main parser ─────────────────────────────────────────────────────────────

const ODDS_DISC_THRESHOLD = 0.15; // decimal odds gap to flag

export function parsePropsEnhanced(raw: RawPropsResponse): ParsedPropsData {
  // category → playerName → bookmaker → { hdp, over, under }
  const grouped: Record<
    string,
    Record<string, Record<string, { hdp: number; over: number; under: number }>>
  > = {};

  for (const [bk, markets] of Object.entries(raw.bookmakers)) {
    for (const market of markets) {
      if (!isPlayerPropMarket(market.name)) continue;

      for (const entry of market.odds) {
        if (!entry.label) continue;

        const rawCat = extractCategory(market.name, entry.label);
        const category = normalizeCategory(rawCat);
        const name = cleanPlayerName(entry.label);
        if (!name) continue;

        if (!grouped[category]) grouped[category] = {};
        if (!grouped[category][name]) grouped[category][name] = {};

        grouped[category][name][bk] = {
          hdp: entry.hdp ?? 0,
          over: entry.over ? parseFloat(entry.over) : 0,
          under: entry.under ? parseFloat(entry.under) : 0,
        };
      }
    }
  }

  // Build PlayerProp for each category+player combo
  const playerPropsMap = new Map<string, PlayerProp[]>();
  const byCategory: Record<string, Map<string, PlayerProp[]>> = {};
  const categories = new Set<string>();

  for (const [category, players] of Object.entries(grouped)) {
    categories.add(category);
    if (!byCategory[category]) byCategory[category] = new Map();

    for (const [playerName, bookmakers] of Object.entries(players)) {
      const bkEntries = Object.entries(bookmakers);
      if (bkEntries.length === 0) continue;

      const lines: PropLine[] = bkEntries.map(([bk, data]) => ({
        bookmaker: bk,
        hdp: data.hdp,
        over: data.over,
        under: data.under,
      }));

      const hdpValues = new Set(lines.map((l) => l.hdp));
      const hasLineDiscrepancy = hdpValues.size > 1;
      const consensusLine = findConsensusLine(lines);

      let bestOver: { bookmaker: string; odds: number } | null = null;
      let bestUnder: { bookmaker: string; odds: number } | null = null;
      let worstOver = Infinity;
      let worstUnder = Infinity;

      for (const l of lines) {
        if (l.over > 0) {
          if (!bestOver || l.over > bestOver.odds) {
            bestOver = { bookmaker: l.bookmaker, odds: l.over };
          }
          if (l.over < worstOver) worstOver = l.over;
        }
        if (l.under > 0) {
          if (!bestUnder || l.under > bestUnder.odds) {
            bestUnder = { bookmaker: l.bookmaker, odds: l.under };
          }
          if (l.under < worstUnder) worstUnder = l.under;
        }
      }

      const overSpread = bestOver ? bestOver.odds - worstOver : 0;
      const underSpread = bestUnder ? bestUnder.odds - worstUnder : 0;
      const hasOddsDiscrepancy =
        overSpread > ODDS_DISC_THRESHOLD || underSpread > ODDS_DISC_THRESHOLD;

      const prop: PlayerProp = {
        propType: category,
        lines,
        consensusLine,
        bestOver,
        bestUnder,
        hasLineDiscrepancy,
        hasOddsDiscrepancy,
      };

      // Add to global player map
      const existing = playerPropsMap.get(playerName) ?? [];
      existing.push(prop);
      playerPropsMap.set(playerName, existing);

      // Add to per-category player map
      const catExisting = byCategory[category].get(playerName) ?? [];
      catExisting.push(prop);
      byCategory[category].set(playerName, catExisting);
    }
  }

  // Build ParsedPlayer objects
  function buildPlayer(name: string, props: PlayerProp[]): ParsedPlayer {
    const edgeCount = props.filter(
      (p) => p.hasLineDiscrepancy || p.hasOddsDiscrepancy,
    ).length;
    return { name, props, edgeCount };
  }

  // Sort players: edge-havers first, then by prop count, then alpha
  function sortPlayers(players: ParsedPlayer[]): ParsedPlayer[] {
    return players.sort((a, b) => {
      if (a.edgeCount !== b.edgeCount) return b.edgeCount - a.edgeCount;
      if (a.props.length !== b.props.length) return b.props.length - a.props.length;
      return a.name.localeCompare(b.name);
    });
  }

  // Global players list
  const allPlayers = sortPlayers(
    Array.from(playerPropsMap.entries()).map(([name, props]) =>
      buildPlayer(name, props),
    ),
  );

  // Per-category players
  const byCategoryResult: Record<string, ParsedPlayer[]> = {};
  const sortedCategories = Array.from(categories).sort();

  for (const cat of sortedCategories) {
    const catMap = byCategory[cat];
    const catPlayers = sortPlayers(
      Array.from(catMap.entries()).map(([name, props]) =>
        buildPlayer(name, props),
      ),
    );
    byCategoryResult[cat] = catPlayers;
  }

  const totalCount = Array.from(playerPropsMap.values()).reduce(
    (sum, props) => sum + props.length,
    0,
  );
  const edgeCount = allPlayers.reduce((sum, p) => sum + p.edgeCount, 0);

  return {
    categories: sortedCategories,
    players: allPlayers,
    byCategory: byCategoryResult,
    totalCount,
    edgeCount,
  };
}

// ── Legacy parser (keep for backward compat with PropsTable) ────────────────

export function parseProps(raw: RawPropsResponse): ParsedPropMarket[] {
  const grouped: Record<
    string,
    Record<string, Record<string, { line: number; over: number; under: number }>>
  > = {};

  for (const [bk, markets] of Object.entries(raw.bookmakers)) {
    for (const market of markets) {
      if (!isPlayerPropMarket(market.name)) continue;

      for (const entry of market.odds) {
        if (!entry.label) continue;
        const rawCat = extractCategory(market.name, entry.label);
        const statType = normalizeCategory(rawCat);
        const cleanName = cleanPlayerName(entry.label);
        if (!cleanName) continue;

        if (!grouped[statType]) grouped[statType] = {};
        if (!grouped[statType][cleanName]) grouped[statType][cleanName] = {};

        grouped[statType][cleanName][bk] = {
          line: entry.hdp ?? 0,
          over: entry.over ? parseFloat(entry.over) : 0,
          under: entry.under ? parseFloat(entry.under) : 0,
        };
      }
    }
  }

  const result: ParsedPropMarket[] = [];

  for (const [statType, players] of Object.entries(grouped)) {
    const lines: ParsedPropLine[] = [];

    for (const [playerName, bookmakers] of Object.entries(players)) {
      const bkEntries = Object.entries(bookmakers);
      if (bkEntries.length === 0) continue;

      const hdpValues = new Set(bkEntries.map(([, v]) => v.line));
      const lineDiscrepancy = hdpValues.size > 1;
      const line = bkEntries[0][1].line;

      const bookmakerOdds: Record<string, { over: number; under: number }> = {};
      let bestOver: { bookmaker: string; odds: number } | null = null;
      let bestUnder: { bookmaker: string; odds: number } | null = null;

      for (const [bk, data] of bkEntries) {
        bookmakerOdds[bk] = { over: data.over, under: data.under };
        if (data.over > 0 && (!bestOver || data.over > bestOver.odds)) {
          bestOver = { bookmaker: bk, odds: data.over };
        }
        if (data.under > 0 && (!bestUnder || data.under > bestUnder.odds)) {
          bestUnder = { bookmaker: bk, odds: data.under };
        }
      }

      lines.push({ playerName, line, bookmakerOdds, bestOver, bestUnder, lineDiscrepancy });
    }

    lines.sort((a, b) => a.playerName.localeCompare(b.playerName));
    result.push({ statType, lines });
  }

  result.sort((a, b) => a.statType.localeCompare(b.statType));
  return result;
}

// ── Converter: ConsolidatedOddsEvent → RawPropsResponse ─────────────────

import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";

/**
 * Convert consolidated event data (from cache/polling) into the shape
 * that `parsePropsEnhanced` expects. The raw API response stored in the
 * cache already contains `label` on player prop odds entries — the
 * WsOddsOutcome type just didn't declare it until now.
 */
export function consolidatedToPropsInput(
  eventOdds: ConsolidatedOddsEvent,
): RawPropsResponse {
  const bookmakers: Record<string, RawMarket[]> = {};

  for (const [bk, data] of Object.entries(eventOdds.bookmakers)) {
    bookmakers[bk] = data.markets.map((m) => ({
      name: m.name,
      odds: m.odds as unknown as RawOddsEntry[],
    }));
  }

  return { bookmakers };
}
