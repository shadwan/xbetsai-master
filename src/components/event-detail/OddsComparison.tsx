"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, Percent } from "lucide-react";
import { TeamLogo } from "@/src/components/TeamLogo";
import { abbreviateBookmaker } from "@/src/lib/utils/props";
import {
  decimalToAmerican,
  impliedProbability,
} from "@/src/lib/utils/odds";
import type {
  ConsolidatedOddsEvent,
  WsMarket,
  WsOddsOutcome,
} from "@/src/lib/odds-api/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface OddsComparisonProps {
  eventOdds: ConsolidatedOddsEvent;
  homeTeam: string;
  awayTeam: string;
  homeAbbrev?: string;
  awayAbbrev?: string;
  league: string;
}

interface RowData {
  key: string; // "home" | "away" | "draw" | "over" | "under"
  label: string; // "CHA +8.5" or "Over 232.5"
  team?: "home" | "away";
  odds: Record<string, number | null>; // bookmaker → decimal odds
  best: { bookmaker: string; odds: number } | null;
  isOutlier: Record<string, boolean>;
}

interface MarketGroup {
  marketName: string; // "ML" | "Spread" | "Totals"
  heading: string; // "MONEYLINE — Pick the Winner"
  subheading?: string;
  hdp?: number;
  lineVaries: boolean;
  mainRows: RowData[];
  altRows: RowData[];
}

const MARKET_ORDER = ["ML", "Spread", "Totals"] as const;

// ── Bookmaker deduplication ──────────────────────────────────────────────────

/**
 * The API sometimes returns the same bookmaker under multiple names
 * (e.g. "Bet365" and "Bet365 (no latency)"). Deduplicate by abbreviation,
 * keeping the entry with the most recent market data.
 */
function dedupeBookmakers(
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
): ConsolidatedOddsEvent["bookmakers"] {
  // Group raw entries by their abbreviated name
  const byAbbrev = new Map<
    string,
    { rawName: string; data: ConsolidatedOddsEvent["bookmakers"][string]; latestTs: number }[]
  >();

  for (const [rawName, data] of Object.entries(bookmakers)) {
    const abbrev = abbreviateBookmaker(rawName);
    let latestTs = 0;
    for (const m of data.markets) {
      const ts = new Date(m.updatedAt).getTime();
      if (ts > latestTs) latestTs = ts;
    }
    const group = byAbbrev.get(abbrev) ?? [];
    group.push({ rawName, data, latestTs });
    byAbbrev.set(abbrev, group);
  }

  // For each abbreviation, pick the entry with the latest timestamp
  const result: Record<string, ConsolidatedOddsEvent["bookmakers"][string]> = {};
  for (const [, group] of byAbbrev) {
    if (group.length === 1) {
      result[group[0].rawName] = group[0].data;
    } else {
      // Pick the freshest data
      group.sort((a, b) => b.latestTs - a.latestTs);
      result[group[0].rawName] = group[0].data;
    }
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatAmerican(decimal: number | null): string {
  if (decimal == null || decimal <= 1) return "—";
  const am = decimalToAmerican(decimal);
  return am > 0 ? `+${am}` : `${am}`;
}

function formatProb(decimal: number | null): string {
  if (decimal == null || decimal <= 1) return "";
  const p = impliedProbability(decimal) * 100;
  return `${p.toFixed(1)}%`;
}

/** Detect outliers: odds more than 3x away from median */
function isOutlierOdds(value: number, allValues: number[]): boolean {
  if (allValues.length < 3) return false;
  const sorted = [...allValues].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  // Convert to implied probability space for comparison
  const valProb = 1 / value;
  const midProb = 1 / mid;
  return valProb / midProb > 3 || midProb / valProb > 3;
}

/**
 * Find the main line for spread/totals across bookmakers.
 * The API guarantees odds[0] is the main line per bookmaker.
 * We take the most common odds[0].hdp across all bookmakers.
 */
function findMainLine(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
): number | null {
  const hdpCounts = new Map<number, number>();

  for (const data of Object.values(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market || market.odds.length === 0) continue;
    // Only look at odds[0] — the main line per bookmaker
    const primary = market.odds[0];
    if (primary.hdp != null) {
      hdpCounts.set(primary.hdp, (hdpCounts.get(primary.hdp) ?? 0) + 1);
    }
  }

  if (hdpCounts.size === 0) return null;

  // Most common hdp across bookmakers' primary lines
  let bestHdp = 0;
  let bestCount = 0;
  for (const [hdp, count] of hdpCounts) {
    if (count > bestCount) {
      bestHdp = hdp;
      bestCount = count;
    }
  }
  return bestHdp;
}

/**
 * Get alternate hdp values for a market (excluding the main line).
 * Only collects lines that appear in odds[1..N] (non-primary entries).
 */
function getAlternateLines(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
  mainHdp: number,
): number[] {
  const lines = new Set<number>();
  for (const data of Object.values(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market) continue;
    // Skip odds[0] (main line) — only collect alternates
    for (let i = 1; i < market.odds.length; i++) {
      const outcome = market.odds[i];
      if (outcome.hdp != null && outcome.hdp !== mainHdp) {
        lines.add(outcome.hdp);
      }
    }
  }
  return Array.from(lines).sort((a, b) => a - b);
}

/** Check if bookmakers disagree on the line */
function checkLineVaries(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
  mainHdp: number,
): boolean {
  for (const data of Object.values(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market) continue;
    const primary = market.odds[0];
    if (primary?.hdp != null && primary.hdp !== mainHdp) return true;
  }
  return false;
}

/**
 * Build row data for a specific market + side + hdp.
 * When isMainLine is true, prefers odds[0] per bookmaker (the primary line)
 * and only uses it if its hdp matches. For alternates, scans the full array.
 */
function buildRow(
  key: string,
  label: string,
  team: "home" | "away" | undefined,
  marketName: string,
  hdp: number | undefined,
  bookmakerNames: string[],
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
  isMainLine = false,
): RowData {
  const odds: Record<string, number | null> = {};
  const allVals: number[] = [];

  for (const bk of bookmakerNames) {
    const data = bookmakers[bk];
    if (!data) {
      odds[bk] = null;
      continue;
    }

    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market) {
      odds[bk] = null;
      continue;
    }

    // Find the outcome
    let outcome: WsOddsOutcome | undefined;
    if (hdp == null) {
      // ML — always use odds[0]
      outcome = market.odds[0];
    } else if (isMainLine) {
      // Main line — prefer odds[0] if hdp matches, otherwise search
      const primary = market.odds[0];
      if (primary?.hdp === hdp) {
        outcome = primary;
      } else {
        // This bookmaker's main line differs — try to find exact match
        outcome = market.odds.find((o) => o.hdp === hdp);
      }
    } else {
      // Alternate line — search the full array
      outcome = market.odds.find((o) => o.hdp === hdp);
    }

    if (!outcome) {
      odds[bk] = null;
      continue;
    }

    const val = outcome[key as keyof WsOddsOutcome];
    const decimal = val != null ? parseFloat(String(val)) : null;
    odds[bk] = decimal && !isNaN(decimal) ? decimal : null;
    if (odds[bk]) allVals.push(odds[bk]!);
  }

  // Detect outliers first
  const isOutlier: Record<string, boolean> = {};
  for (const bk of bookmakerNames) {
    const d = odds[bk];
    isOutlier[bk] = d != null ? isOutlierOdds(d, allVals) : false;
  }

  // Find best — excluding outliers
  let best: { bookmaker: string; odds: number } | null = null;
  for (const bk of bookmakerNames) {
    const d = odds[bk];
    if (d != null && !isOutlier[bk] && (!best || d > best.odds)) {
      best = { bookmaker: bk, odds: d };
    }
  }
  // Fallback: if all non-null values are outliers, pick the best among them
  if (!best) {
    for (const bk of bookmakerNames) {
      const d = odds[bk];
      if (d != null && (!best || d > best.odds)) {
        best = { bookmaker: bk, odds: d };
      }
    }
  }

  return { key, label, team, odds, best, isOutlier };
}

// ── Market Group Builder ─────────────────────────────────────────────────────

function buildMarketGroups(
  eventOdds: ConsolidatedOddsEvent,
  homeTeam: string,
  awayTeam: string,
  homeAbbrev: string,
  awayAbbrev: string,
  bookmakerNames: string[],
): MarketGroup[] {
  const groups: MarketGroup[] = [];

  for (const marketName of MARKET_ORDER) {
    // Check if any bookmaker has this market
    const hasMarket = Object.values(eventOdds.bookmakers).some((d) =>
      d.markets.some((m: WsMarket) => m.name === marketName),
    );
    if (!hasMarket) continue;

    const mainHdp = findMainLine(marketName, eventOdds.bookmakers);
    const lineVaries =
      mainHdp != null
        ? checkLineVaries(marketName, eventOdds.bookmakers, mainHdp)
        : false;

    let heading: string;
    let subheading: string | undefined;

    switch (marketName) {
      case "ML": {
        heading = "MONEYLINE";
        subheading = "Pick the Winner";
        break;
      }
      case "Spread": {
        const absHdp = mainHdp != null ? Math.abs(mainHdp) : 0;
        heading = "SPREAD";
        subheading = mainHdp != null ? `${absHdp} points` : undefined;
        break;
      }
      case "Totals": {
        heading = "TOTAL";
        subheading = mainHdp != null ? `Over/Under ${mainHdp}` : undefined;
        break;
      }
    }

    // Build main rows
    const mainRows: RowData[] = [];

    if (marketName === "ML") {
      mainRows.push(
        buildRow(
          "away",
          awayAbbrev,
          "away",
          marketName,
          undefined,
          bookmakerNames,
          eventOdds.bookmakers,
        ),
        buildRow(
          "home",
          homeAbbrev,
          "home",
          marketName,
          undefined,
          bookmakerNames,
          eventOdds.bookmakers,
        ),
      );

      // Check for draw
      const hasDraw = Object.values(eventOdds.bookmakers).some((d) => {
        const m = d.markets.find((mk: WsMarket) => mk.name === "ML");
        return m?.odds[0]?.draw != null;
      });
      if (hasDraw) {
        mainRows.push(
          buildRow(
            "draw",
            "Draw",
            undefined,
            marketName,
            undefined,
            bookmakerNames,
            eventOdds.bookmakers,
          ),
        );
      }
    } else if (marketName === "Spread" && mainHdp != null) {
      // hdp is the home team's handicap
      const homeSpread =
        mainHdp > 0 ? `+${mainHdp}` : `${mainHdp}`;
      const awaySpread =
        -mainHdp > 0 ? `+${-mainHdp}` : `${-mainHdp}`;

      mainRows.push(
        buildRow(
          "away",
          `${awayAbbrev} ${awaySpread}`,
          "away",
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
          true, // isMainLine
        ),
        buildRow(
          "home",
          `${homeAbbrev} ${homeSpread}`,
          "home",
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
          true, // isMainLine
        ),
      );
    } else if (marketName === "Totals" && mainHdp != null) {
      mainRows.push(
        buildRow(
          "over",
          `Over ${mainHdp}`,
          undefined,
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
          true, // isMainLine
        ),
        buildRow(
          "under",
          `Under ${mainHdp}`,
          undefined,
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
          true, // isMainLine
        ),
      );
    }

    // Build alt rows (non-main hdp lines)
    const altRows: RowData[] = [];
    if ((marketName === "Spread" || marketName === "Totals") && mainHdp != null) {
      const altHdps = getAlternateLines(marketName, eventOdds.bookmakers, mainHdp);
      for (const hdp of altHdps) {
        if (marketName === "Spread") {
          const homeSpread = hdp > 0 ? `+${hdp}` : `${hdp}`;
          const awaySpread = -hdp > 0 ? `+${-hdp}` : `${-hdp}`;
          altRows.push(
            buildRow(
              "away",
              `${awayAbbrev} ${awaySpread}`,
              "away",
              marketName,
              hdp,
              bookmakerNames,
              eventOdds.bookmakers,
            ),
            buildRow(
              "home",
              `${homeAbbrev} ${homeSpread}`,
              "home",
              marketName,
              hdp,
              bookmakerNames,
              eventOdds.bookmakers,
            ),
          );
        } else {
          altRows.push(
            buildRow(
              "over",
              `Over ${hdp}`,
              undefined,
              marketName,
              hdp,
              bookmakerNames,
              eventOdds.bookmakers,
            ),
            buildRow(
              "under",
              `Under ${hdp}`,
              undefined,
              marketName,
              hdp,
              bookmakerNames,
              eventOdds.bookmakers,
            ),
          );
        }
      }
    }

    groups.push({
      marketName,
      heading,
      subheading,
      hdp: mainHdp ?? undefined,
      lineVaries,
      mainRows,
      altRows,
    });
  }

  return groups;
}

// ── "Where to Bet" Summary ───────────────────────────────────────────────────

function WhereToBet({
  groups,
  homeAbbrev,
  awayAbbrev,
}: {
  groups: MarketGroup[];
  homeAbbrev: string;
  awayAbbrev: string;
}) {
  const items: string[] = [];

  for (const g of groups) {
    for (const row of g.mainRows) {
      if (!row.best) continue;
      const am = formatAmerican(row.best.odds);
      const bk = abbreviateBookmaker(row.best.bookmaker);
      const side =
        row.team === "home"
          ? homeAbbrev
          : row.team === "away"
            ? awayAbbrev
            : row.label;
      items.push(`${bk} ${am} ${side}`);
      break; // Only the first (best) row per market for summary
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base text-text-secondary">
      <span className="font-semibold text-text-primary uppercase tracking-wider">
        Best prices
      </span>
      {groups.map((g) => {
        // Find the row with the highest best odds (biggest underdog / most value)
        let bestRow: RowData | null = null;
        for (const row of g.mainRows) {
          if (row.best && (!bestRow?.best || row.best.odds > bestRow.best.odds)) {
            bestRow = row;
          }
        }
        if (!bestRow?.best) return null;

        const am = formatAmerican(bestRow.best.odds);
        const bk = abbreviateBookmaker(bestRow.best.bookmaker);
        const side =
          bestRow.team === "home"
            ? homeAbbrev
            : bestRow.team === "away"
              ? awayAbbrev
              : bestRow.label;

        return (
          <span key={g.marketName} className="inline-flex items-center gap-1.5">
            <span className="font-medium text-text-primary">{g.heading.split(" ")[0]}:</span>
            <span className="text-neon-green font-mono font-semibold">{am}</span>
            <span className="text-text-secondary">
              {side} @ {bk}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ── Consensus Bar ────────────────────────────────────────────────────────────

function ConsensusBar({
  rows,
  homeAbbrev,
  awayAbbrev,
}: {
  rows: RowData[];
  homeAbbrev: string;
  awayAbbrev: string;
}) {
  // Calculate average implied probability per side
  const sides: { label: string; prob: number; team?: "home" | "away" }[] = [];

  for (const row of rows) {
    const vals = Object.values(row.odds).filter(
      (v): v is number => v != null && v > 1,
    );
    if (vals.length === 0) continue;
    const avgDecimal = vals.reduce((a, b) => a + b, 0) / vals.length;
    const prob = impliedProbability(avgDecimal);
    const label =
      row.team === "home"
        ? homeAbbrev
        : row.team === "away"
          ? awayAbbrev
          : row.label;
    sides.push({ label, prob, team: row.team });
  }

  if (sides.length < 2) return null;

  // Normalize to 100%
  const total = sides.reduce((s, v) => s + v.prob, 0);
  if (total <= 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {sides.map((side, i) => {
        const pct = (side.prob / total) * 100;
        const isFavorite = pct > 55;
        return (
          <div key={i} className="flex items-center gap-2 text-base">
            <span
              className={cn(
                "font-semibold tabular-nums",
                isFavorite ? "text-neon-cyan" : "text-text-secondary",
              )}
            >
              {side.label}
            </span>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden" style={{ width: 72 }}>
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFavorite ? "bg-neon-cyan" : "bg-white/30",
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-text-secondary font-mono">
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Odds Cell ────────────────────────────────────────────────────────────────

function OddsCell({
  decimal,
  isBest,
  isOutlier,
  showProb,
  bookmakerUrl,
  bookmakerName,
}: {
  decimal: number | null;
  isBest: boolean;
  isOutlier: boolean;
  showProb: boolean;
  bookmakerUrl?: string;
  bookmakerName: string;
}) {
  const prevRef = useRef<number | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    const prev = prevRef.current;
    prevRef.current = decimal;

    if (el == null || decimal == null || prev == null) return;
    if (decimal > prev) {
      el.classList.add("animate-flash-green");
    } else if (decimal < prev) {
      el.classList.add("animate-flash-red");
    }
  }, [decimal]);

  const handleAnimationEnd = () => {
    elRef.current?.classList.remove("animate-flash-green", "animate-flash-red");
  };

  if (decimal == null) {
    return (
      <div className="flex h-full min-h-[52px] items-center justify-center text-text-tertiary font-mono text-base">
        —
      </div>
    );
  }

  const display = formatAmerican(decimal);
  const prob = formatProb(decimal);
  const abbr = abbreviateBookmaker(bookmakerName);

  const content = (
    <div
      ref={elRef}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg px-1.5 py-2 min-h-[52px] transition-colors text-center",
        isBest
          ? "bg-neon-green/[0.12] ring-1 ring-neon-green/25"
          : "hover:bg-white/[0.04]",
        bookmakerUrl && "cursor-pointer",
      )}
      title={
        isOutlier
          ? "This line differs significantly from other books — may be stale or heavily shaded"
          : bookmakerUrl
            ? `Open ${abbr}`
            : undefined
      }
    >
      <div className="flex items-center gap-0.5">
        <span
          className={cn(
            "font-mono text-base font-semibold tabular-nums",
            isBest ? "text-neon-green" : "text-text-primary",
          )}
        >
          {display}
        </span>
        {isOutlier && (
          <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
        )}
      </div>
      {showProb && prob && (
        <span className="text-base tabular-nums text-text-secondary font-mono">
          {prob}
        </span>
      )}
    </div>
  );

  if (bookmakerUrl) {
    return (
      <a
        href={bookmakerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

// ── Best Column Cell ─────────────────────────────────────────────────────────

function BestCell({
  row,
  showProb,
}: {
  row: RowData;
  showProb: boolean;
}) {
  if (!row.best) {
    return (
      <div className="flex min-h-[52px] items-center justify-center text-text-tertiary font-mono text-base">
        —
      </div>
    );
  }

  const display = formatAmerican(row.best.odds);
  const prob = formatProb(row.best.odds);
  const bk = abbreviateBookmaker(row.best.bookmaker);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white/[0.06] px-2 py-2 min-h-[52px]">
      <span className="font-mono text-base font-bold tabular-nums text-neon-cyan">
        {display}
      </span>
      <span className="text-base text-text-secondary">{bk}</span>
      {showProb && prob && (
        <span className="text-base tabular-nums text-text-secondary font-mono">
          {prob}
        </span>
      )}
    </div>
  );
}

// ── Market Section ───────────────────────────────────────────────────────────

function MarketSection({
  group,
  bookmakerNames,
  bookmakerUrls,
  showProb,
  homeAbbrev,
  awayAbbrev,
  league,
  homeTeam,
  awayTeam,
}: {
  group: MarketGroup;
  bookmakerNames: string[];
  bookmakerUrls: Record<string, string>;
  showProb: boolean;
  homeAbbrev: string;
  awayAbbrev: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
}) {
  const [showAlts, setShowAlts] = useState(false);

  const renderRows = (rows: RowData[]) =>
    rows.map((row, idx) => (
      <div
        key={`${row.key}-${row.label}-${idx}`}
        className="grid items-center gap-px"
        style={{
          gridTemplateColumns: `minmax(130px, 170px) 90px repeat(${bookmakerNames.length}, minmax(80px, 1fr))`,
        }}
      >
        {/* Row label */}
        <div className="flex items-center gap-2 pr-2 py-1">
          {row.team && (
            <TeamLogo
              league={league}
              teamName={row.team === "home" ? homeTeam : awayTeam}
              size={20}
            />
          )}
          <span className="text-base font-semibold text-text-primary truncate tabular-nums">
            {row.label}
          </span>
        </div>

        {/* BEST column */}
        <BestCell row={row} showProb={showProb} />

        {/* Bookmaker columns */}
        {bookmakerNames.map((bk) => (
          <OddsCell
            key={bk}
            decimal={row.odds[bk] ?? null}
            isBest={row.best?.bookmaker === bk && row.odds[bk] != null}
            isOutlier={row.isOutlier[bk] ?? false}
            showProb={showProb}
            bookmakerUrl={bookmakerUrls[bk]}
            bookmakerName={bk}
          />
        ))}
      </div>
    ));

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold uppercase tracking-widest text-text-secondary">
            {group.heading}
          </span>
          {group.subheading && (
            <>
              <span className="text-text-tertiary">—</span>
              <span className="text-base text-text-secondary">
                {group.subheading}
              </span>
            </>
          )}
          {group.lineVaries && (
            <span
              className="inline-flex items-center gap-1 text-base text-amber-400"
              title="Line varies between bookmakers"
            >
              <AlertTriangle size={16} />
              line varies
            </span>
          )}
        </div>

        {/* Consensus bar */}
        <ConsensusBar
          rows={group.mainRows}
          homeAbbrev={homeAbbrev}
          awayAbbrev={awayAbbrev}
        />
      </div>

      {/* Data rows */}
      <div className="px-3 py-1.5 space-y-px">
        {renderRows(group.mainRows)}
      </div>

      {/* Alternate lines toggle */}
      {group.altRows.length > 0 && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowAlts(!showAlts)}
            className="flex w-full items-center justify-center gap-1.5 py-2.5 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
          >
            {showAlts ? "Hide" : "Show"} {group.altRows.length / 2} alternate
            line{group.altRows.length / 2 !== 1 ? "s" : ""}
            <ChevronDown
              size={16}
              className={cn("transition-transform", showAlts && "rotate-180")}
            />
          </button>
          {showAlts && (
            <div className="px-3 pb-2 space-y-px">
              {renderRows(group.altRows)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function OddsComparison({
  eventOdds,
  homeTeam,
  awayTeam,
  homeAbbrev: homeAbbrevProp,
  awayAbbrev: awayAbbrevProp,
  league,
}: OddsComparisonProps) {
  const [showProb, setShowProb] = useState(false);

  // Deduplicate bookmakers (e.g. "Bet365" + "Bet365 (no latency)" → keep freshest)
  const dedupedOdds = useMemo(
    (): ConsolidatedOddsEvent => ({
      ...eventOdds,
      bookmakers: dedupeBookmakers(eventOdds.bookmakers),
    }),
    [eventOdds],
  );

  // Derive abbreviations from team names if not provided
  const homeAbbrev =
    homeAbbrevProp ??
    homeTeam
      .split(/\s+/)
      .pop()
      ?.slice(0, 3)
      .toUpperCase() ??
    "HOME";
  const awayAbbrev =
    awayAbbrevProp ??
    awayTeam
      .split(/\s+/)
      .pop()
      ?.slice(0, 3)
      .toUpperCase() ??
    "AWAY";

  // Discover which bookmakers have data (from deduped set)
  const bookmakerNames = useMemo(() => {
    const names = Object.keys(dedupedOdds.bookmakers);
    return names.sort((a, b) => a.localeCompare(b));
  }, [dedupedOdds.bookmakers]);

  // Extract bookmaker URLs
  const bookmakerUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const [bk, data] of Object.entries(dedupedOdds.bookmakers)) {
      if (data.url) urls[bk] = data.url;
    }
    return urls;
  }, [dedupedOdds.bookmakers]);

  // Build market groups
  const groups = useMemo(
    () =>
      buildMarketGroups(
        dedupedOdds,
        homeTeam,
        awayTeam,
        homeAbbrev,
        awayAbbrev,
        bookmakerNames,
      ),
    [dedupedOdds, homeTeam, awayTeam, homeAbbrev, awayAbbrev, bookmakerNames],
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
        <p className="text-base text-text-secondary">
          No odds data available yet.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-text-primary">
            Odds Comparison
          </h2>
          <span className="rounded-full bg-white/10 px-3 py-1 text-base font-medium text-text-secondary tabular-nums">
            {bookmakerNames.length} book{bookmakerNames.length !== 1 ? "s" : ""} live
          </span>
        </div>

        {/* Show % toggle */}
        <button
          onClick={() => setShowProb(!showProb)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-base font-semibold transition-colors",
            showProb
              ? "bg-neon-cyan/15 text-neon-cyan ring-1 ring-neon-cyan/30"
              : "bg-white/[0.06] text-text-secondary hover:bg-white/10 hover:text-text-primary",
          )}
        >
          <Percent size={16} />
          {showProb ? "Hide %" : "Show %"}
        </button>
      </div>

      {/* Where to bet summary */}
      <WhereToBet
        groups={groups}
        homeAbbrev={homeAbbrev}
        awayAbbrev={awayAbbrev}
      />

      {/* Unified table */}
      <div className="rounded-xl border border-white/10 bg-[#080e18] overflow-hidden">
        {/* Column headers — sticky on scroll */}
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            {/* Header row */}
            <div
              className="grid items-center gap-px px-4 py-3 border-b border-white/10 bg-white/[0.04]"
              style={{
                gridTemplateColumns: `minmax(130px, 170px) 90px repeat(${bookmakerNames.length}, minmax(80px, 1fr))`,
              }}
            >
              <div />
              <div className="text-center text-base font-bold uppercase tracking-widest text-neon-cyan">
                Best
              </div>
              {bookmakerNames.map((bk) => (
                <div
                  key={bk}
                  className="text-center text-base font-bold uppercase tracking-wider text-text-secondary truncate"
                  title={bk}
                >
                  {abbreviateBookmaker(bk)}
                </div>
              ))}
            </div>

            {/* Market sections */}
            {groups.map((group, i) => (
              <div
                key={group.marketName}
                className={cn(i > 0 && "border-t border-white/10")}
              >
                <MarketSection
                  group={group}
                  bookmakerNames={bookmakerNames}
                  bookmakerUrls={bookmakerUrls}
                  showProb={showProb}
                  homeAbbrev={homeAbbrev}
                  awayAbbrev={awayAbbrev}
                  league={league}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
