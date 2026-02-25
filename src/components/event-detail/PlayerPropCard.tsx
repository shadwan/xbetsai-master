"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { decimalToAmerican } from "@/src/lib/utils/odds";
import { PlayerAvatar } from "./PlayerAvatar";

interface PlayerPropCardProps {
  playerName: string;
  propType: string;
  league: string;
  consensusLine: number;
  bestOver: { bookmaker: string; odds: number } | null;
  bestUnder: { bookmaker: string; odds: number } | null;
  hasLineDiscrepancy: boolean;
  allLines: { bookmaker: string; hdp: number; over: number; under: number }[];
}

function formatOdds(decimal: number): string {
  if (decimal <= 0) return "—";
  const am = decimalToAmerican(decimal);
  return am > 0 ? `+${am}` : `${am}`;
}

export function PlayerPropCard({
  playerName,
  propType,
  league,
  consensusLine,
  bestOver,
  bestUnder,
  hasLineDiscrepancy,
  allLines,
}: PlayerPropCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine which side has better value (higher decimal odds = better payout)
  const overBetter =
    bestOver && bestUnder ? bestOver.odds > bestUnder.odds : false;
  const underBetter =
    bestOver && bestUnder ? bestUnder.odds > bestOver.odds : false;

  return (
    <div className="overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
      <div className="px-4 py-3.5 sm:px-5">
        {/* Header: avatar + player info */}
        <div className="flex items-center gap-3">
          <PlayerAvatar playerName={playerName} league={league} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-text-primary leading-tight truncate">
              {playerName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-text-tertiary">
                {propType}
              </span>
              <span className="text-xs text-text-secondary tabular-nums">
                Line: {consensusLine}
              </span>
            </div>
          </div>
        </div>

        {/* Over / Under boxes */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {/* Over */}
          <div
            className={cn(
              "rounded-lg px-3 py-2.5 text-center transition-colors",
              overBetter
                ? "bg-neon-green/[0.07] ring-1 ring-neon-green/20"
                : "bg-white/[0.03] ring-1 ring-white/[0.06]",
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Over
            </span>
            <p
              className={cn(
                "mt-0.5 text-xl font-[900] tabular-nums",
                overBetter ? "text-neon-green" : "text-text-primary",
              )}
            >
              {bestOver ? formatOdds(bestOver.odds) : "—"}
            </p>
            {bestOver && (
              <p className="mt-0.5 text-[10px] text-text-tertiary truncate">
                {bestOver.bookmaker}
              </p>
            )}
          </div>

          {/* Under */}
          <div
            className={cn(
              "rounded-lg px-3 py-2.5 text-center transition-colors",
              underBetter
                ? "bg-neon-green/[0.07] ring-1 ring-neon-green/20"
                : "bg-white/[0.03] ring-1 ring-white/[0.06]",
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Under
            </span>
            <p
              className={cn(
                "mt-0.5 text-xl font-[900] tabular-nums",
                underBetter ? "text-neon-green" : "text-text-primary",
              )}
            >
              {bestUnder ? formatOdds(bestUnder.odds) : "—"}
            </p>
            {bestUnder && (
              <p className="mt-0.5 text-[10px] text-text-tertiary truncate">
                {bestUnder.bookmaker}
              </p>
            )}
          </div>
        </div>

        {/* Line discrepancy warning */}
        {hasLineDiscrepancy && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-neon-yellow/[0.06] px-2.5 py-1.5">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-neon-yellow" />
            <p className="text-[11px] leading-snug text-neon-yellow/80">
              Line varies:{" "}
              {allLines.map((l) => `${l.bookmaker} ${l.hdp}`).join(" / ")}
            </p>
          </div>
        )}

        {/* Expand toggle (only if multiple bookmakers) */}
        {allLines.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary transition-colors"
          >
            {expanded ? "Hide" : "All"} bookmakers
            <ChevronDown
              size={13}
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* Expanded bookmaker details */}
      {expanded && allLines.length > 1 && (
        <div className="border-t border-white/[0.04] px-4 py-2.5 sm:px-5">
          <div className="space-y-1.5">
            {allLines.map((l) => (
              <div
                key={l.bookmaker}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-text-secondary">{l.bookmaker}</span>
                <div className="flex items-center gap-3">
                  <span className="text-text-tertiary tabular-nums">
                    {l.hdp}
                  </span>
                  <span
                    className={cn(
                      "w-14 text-right font-mono tabular-nums",
                      bestOver?.bookmaker === l.bookmaker && bestOver?.odds === l.over
                        ? "text-neon-green"
                        : "text-text-primary",
                    )}
                  >
                    {formatOdds(l.over)}
                  </span>
                  <span
                    className={cn(
                      "w-14 text-right font-mono tabular-nums",
                      bestUnder?.bookmaker === l.bookmaker && bestUnder?.odds === l.under
                        ? "text-neon-green"
                        : "text-text-primary",
                    )}
                  >
                    {formatOdds(l.under)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
