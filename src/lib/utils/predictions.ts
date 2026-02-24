import type { ConsolidatedOddsEvent, WsMarket } from "@/src/lib/odds-api/types";
import { getTeamNames } from "@/src/lib/utils/odds";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OutcomeProbability {
  name: string;
  probability: number; // 0–1
}

export interface MarketConsensus {
  home: OutcomeProbability;
  away: OutcomeProbability;
  draw?: OutcomeProbability;
  bookmakerCount: number;
}

// Per-bookmaker de-vigged probabilities (for detail page breakdown)
export interface BookmakerProbabilities {
  bookmaker: string;
  home: number; // 0–1
  away: number; // 0–1
  draw?: number; // 0–1
}

// ── De-vig helpers ───────────────────────────────────────────────────────────

/**
 * Extract de-vigged probabilities from a single bookmaker's ML market.
 * Returns null if the bookmaker has no ML odds.
 */
function deVigBookmaker(
  markets: readonly WsMarket[],
): { home: number; away: number; draw?: number } | null {
  const ml = markets.find((m) => m.name === "ML");
  if (!ml || ml.odds.length === 0) return null;

  const outcome = ml.odds[0];
  const homeOdds = outcome.home ? parseFloat(outcome.home) : 0;
  const awayOdds = outcome.away ? parseFloat(outcome.away) : 0;
  if (homeOdds <= 1 || awayOdds <= 1) return null;

  const drawOdds = outcome.draw ? parseFloat(outcome.draw) : 0;
  const hasDraw = drawOdds > 1;

  // Implied probabilities (include vig)
  const homeImp = 1 / homeOdds;
  const awayImp = 1 / awayOdds;
  const drawImp = hasDraw ? 1 / drawOdds : 0;

  // Total > 1 due to vig
  const total = homeImp + awayImp + drawImp;
  if (total <= 0) return null;

  // De-vig: normalize to sum to 1
  const result: { home: number; away: number; draw?: number } = {
    home: homeImp / total,
    away: awayImp / total,
  };
  if (hasDraw) {
    result.draw = drawImp / total;
  }
  return result;
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute the market consensus win probabilities for an event by averaging
 * de-vigged moneyline probabilities across all available bookmakers.
 *
 * Returns null if fewer than 2 bookmakers have ML odds.
 */
export function computeMarketConsensus(
  event: ConsolidatedOddsEvent,
): MarketConsensus | null {
  const { home, away } = getTeamNames(event.event);
  const devigged: { home: number; away: number; draw?: number }[] = [];

  for (const bkData of Object.values(event.bookmakers)) {
    const result = deVigBookmaker(bkData.markets);
    if (result) devigged.push(result);
  }

  if (devigged.length < 2) return null;

  const n = devigged.length;
  const avgHome = devigged.reduce((s, d) => s + d.home, 0) / n;
  const avgAway = devigged.reduce((s, d) => s + d.away, 0) / n;

  const hasDraw = devigged.some((d) => d.draw != null);
  const avgDraw = hasDraw
    ? devigged.reduce((s, d) => s + (d.draw ?? 0), 0) / n
    : undefined;

  const consensus: MarketConsensus = {
    home: { name: home, probability: Math.round(avgHome * 1000) / 1000 },
    away: { name: away, probability: Math.round(avgAway * 1000) / 1000 },
    bookmakerCount: n,
  };

  if (avgDraw != null) {
    consensus.draw = { name: "Draw", probability: Math.round(avgDraw * 1000) / 1000 };
  }

  return consensus;
}

/**
 * Get per-bookmaker de-vigged probabilities for the breakdown table.
 */
export function getBookmakerBreakdown(
  event: ConsolidatedOddsEvent,
): BookmakerProbabilities[] {
  const results: BookmakerProbabilities[] = [];

  for (const [bookmaker, bkData] of Object.entries(event.bookmakers)) {
    const devigged = deVigBookmaker(bkData.markets);
    if (!devigged) continue;

    const entry: BookmakerProbabilities = {
      bookmaker,
      home: Math.round(devigged.home * 1000) / 1000,
      away: Math.round(devigged.away * 1000) / 1000,
    };
    if (devigged.draw != null) {
      entry.draw = Math.round(devigged.draw * 1000) / 1000;
    }
    results.push(entry);
  }

  return results;
}
