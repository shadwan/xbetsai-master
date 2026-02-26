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

/** Find the main line (closest to even money across books) for spread/totals */
function findMainLine(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
): number | null {
  const hdpCounts = new Map<number, number>();

  for (const data of Object.values(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market) continue;
    for (const outcome of market.odds) {
      if (outcome.hdp != null) {
        hdpCounts.set(outcome.hdp, (hdpCounts.get(outcome.hdp) ?? 0) + 1);
      }
    }
  }

  if (hdpCounts.size === 0) return null;

  // Most common hdp is the main line
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

/** Get all unique hdp values for a market */
function getAllLines(
  marketName: string,
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
): number[] {
  const lines = new Set<number>();
  for (const data of Object.values(bookmakers)) {
    const market = data.markets.find((m: WsMarket) => m.name === marketName);
    if (!market) continue;
    for (const outcome of market.odds) {
      if (outcome.hdp != null) lines.add(outcome.hdp);
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

/** Build row data for a specific market + side + hdp */
function buildRow(
  key: string,
  label: string,
  team: "home" | "away" | undefined,
  marketName: string,
  hdp: number | undefined,
  bookmakerNames: string[],
  bookmakers: ConsolidatedOddsEvent["bookmakers"],
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

    // Find the outcome matching our hdp (or first outcome for ML)
    let outcome: WsOddsOutcome | undefined;
    if (hdp != null) {
      outcome = market.odds.find((o) => o.hdp === hdp);
    } else {
      outcome = market.odds[0];
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

  // Find best
  let best: { bookmaker: string; odds: number } | null = null;
  for (const bk of bookmakerNames) {
    const d = odds[bk];
    if (d != null && (!best || d > best.odds)) {
      best = { bookmaker: bk, odds: d };
    }
  }

  // Detect outliers
  const isOutlier: Record<string, boolean> = {};
  for (const bk of bookmakerNames) {
    const d = odds[bk];
    isOutlier[bk] = d != null ? isOutlierOdds(d, allVals) : false;
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
    const allLines = getAllLines(marketName, eventOdds.bookmakers);
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
        ),
        buildRow(
          "home",
          `${homeAbbrev} ${homeSpread}`,
          "home",
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
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
        ),
        buildRow(
          "under",
          `Under ${mainHdp}`,
          undefined,
          marketName,
          mainHdp,
          bookmakerNames,
          eventOdds.bookmakers,
        ),
      );
    }

    // Build alt rows (non-main hdp lines)
    const altRows: RowData[] = [];
    if ((marketName === "Spread" || marketName === "Totals") && mainHdp != null) {
      const altHdps = allLines.filter((h) => h !== mainHdp);
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
      <span className="font-semibold text-text-secondary uppercase tracking-wider">
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
          <span key={g.marketName} className="inline-flex items-center gap-1">
            <span className="font-medium text-text-secondary">{g.heading.split(" ")[0]}:</span>
            <span className="text-neon-green font-mono font-semibold">{am}</span>
            <span className="text-text-tertiary">
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
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                "font-semibold tabular-nums",
                isFavorite ? "text-neon-cyan" : "text-text-tertiary",
              )}
            >
              {side.label}
            </span>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden" style={{ width: 60 }}>
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFavorite ? "bg-neon-cyan" : "bg-white/20",
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-text-tertiary font-mono">
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
      <div className="flex h-full min-h-[40px] items-center justify-center text-text-tertiary/40 font-mono text-sm">
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
        "flex flex-col items-center justify-center rounded-lg px-1 py-1.5 min-h-[40px] transition-colors text-center",
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
            "font-mono text-sm font-semibold tabular-nums",
            isBest ? "text-neon-green" : "text-text-primary",
          )}
        >
          {display}
        </span>
        {isOutlier && (
          <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
        )}
      </div>
      {showProb && prob && (
        <span className="text-[10px] tabular-nums text-text-tertiary/60 font-mono">
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
      <div className="flex min-h-[40px] items-center justify-center text-text-tertiary/40 font-mono text-sm">
        —
      </div>
    );
  }

  const display = formatAmerican(row.best.odds);
  const prob = formatProb(row.best.odds);
  const bk = abbreviateBookmaker(row.best.bookmaker);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white/[0.03] px-1 py-1.5 min-h-[40px]">
      <span className="font-mono text-sm font-bold tabular-nums text-neon-cyan">
        {display}
      </span>
      <span className="text-[10px] text-text-tertiary/60">{bk}</span>
      {showProb && prob && (
        <span className="text-[10px] tabular-nums text-text-tertiary/40 font-mono">
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
          gridTemplateColumns: `minmax(100px, 130px) 72px repeat(${bookmakerNames.length}, minmax(60px, 1fr))`,
        }}
      >
        {/* Row label */}
        <div className="flex items-center gap-1.5 pr-2 py-1">
          {row.team && (
            <TeamLogo
              league={league}
              teamName={row.team === "home" ? homeTeam : awayTeam}
              size={16}
            />
          )}
          <span className="text-xs font-semibold text-text-secondary truncate tabular-nums">
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
      <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.015] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
            {group.heading}
          </span>
          {group.subheading && (
            <>
              <span className="text-text-tertiary/30">—</span>
              <span className="text-[11px] text-text-tertiary/70">
                {group.subheading}
              </span>
            </>
          )}
          {group.lineVaries && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] text-amber-400"
              title="Line varies between bookmakers"
            >
              <AlertTriangle size={10} />
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
        <div className="border-t border-white/[0.03]">
          <button
            onClick={() => setShowAlts(!showAlts)}
            className="flex w-full items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-text-tertiary/60 hover:text-text-tertiary hover:bg-white/[0.02] transition-colors"
          >
            {showAlts ? "Hide" : "Show"} {group.altRows.length / 2} alternate
            line{group.altRows.length / 2 !== 1 ? "s" : ""}
            <ChevronDown
              size={12}
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

  // Discover which bookmakers have data
  const bookmakerNames = useMemo(() => {
    const names = Object.keys(eventOdds.bookmakers);
    // Sort by our preferred BOOKMAKERS order, then alphabetically
    return names.sort((a, b) => a.localeCompare(b));
  }, [eventOdds.bookmakers]);

  // Extract bookmaker URLs
  const bookmakerUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    for (const [bk, data] of Object.entries(eventOdds.bookmakers)) {
      if (data.url) urls[bk] = data.url;
    }
    return urls;
  }, [eventOdds.bookmakers]);

  // Build market groups
  const groups = useMemo(
    () =>
      buildMarketGroups(
        eventOdds,
        homeTeam,
        awayTeam,
        homeAbbrev,
        awayAbbrev,
        bookmakerNames,
      ),
    [eventOdds, homeTeam, awayTeam, homeAbbrev, awayAbbrev, bookmakerNames],
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
        <p className="text-sm text-text-secondary">
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
          <h2 className="text-lg font-semibold text-text-primary">
            Odds Comparison
          </h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-text-tertiary tabular-nums">
            {bookmakerNames.length} book{bookmakerNames.length !== 1 ? "s" : ""} live
          </span>
        </div>

        {/* Show % toggle */}
        <button
          onClick={() => setShowProb(!showProb)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
            showProb
              ? "bg-neon-cyan/10 text-neon-cyan ring-1 ring-neon-cyan/20"
              : "bg-white/[0.04] text-text-tertiary hover:bg-white/[0.06] hover:text-text-secondary",
          )}
        >
          <Percent size={12} />
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
      <div className="rounded-xl border border-white/[0.06] bg-[#080e18] overflow-hidden">
        {/* Column headers — sticky on scroll */}
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            {/* Header row */}
            <div
              className="grid items-center gap-px px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]"
              style={{
                gridTemplateColumns: `minmax(100px, 130px) 72px repeat(${bookmakerNames.length}, minmax(60px, 1fr))`,
              }}
            >
              <div />
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-neon-cyan/70">
                Best
              </div>
              {bookmakerNames.map((bk) => (
                <div
                  key={bk}
                  className="text-center text-[10px] font-bold uppercase tracking-wider text-text-tertiary truncate"
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
                className={cn(i > 0 && "border-t border-white/[0.06]")}
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
