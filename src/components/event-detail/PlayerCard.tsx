"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, AlertTriangle, TrendingUp } from "lucide-react";
import { decimalToAmerican } from "@/src/lib/utils/odds";
import { abbreviateBookmaker } from "@/src/lib/utils/props";
import type { PlayerProp } from "@/src/lib/utils/props";
import { PlayerAvatar } from "./PlayerAvatar";

interface PlayerCardProps {
  playerName: string;
  league: string;
  props: PlayerProp[];
  edgeOnly?: boolean;
  evPropKeys?: Set<string>; // "propType|line" keys that match +EV bets
}

function formatOdds(decimal: number): string {
  if (decimal <= 0) return "\u2014";
  const am = decimalToAmerican(decimal);
  return am > 0 ? `+${am}` : `${am}`;
}

function hasEdge(prop: PlayerProp, evPropKeys?: Set<string>): boolean {
  return (
    prop.hasLineDiscrepancy ||
    prop.hasOddsDiscrepancy ||
    (evPropKeys?.has(`${prop.propType}|${prop.consensusLine}`) ?? false)
  );
}

export function PlayerCard({
  playerName,
  league,
  props,
  edgeOnly = false,
  evPropKeys,
}: PlayerCardProps) {
  const [expandedProp, setExpandedProp] = useState<string | null>(null);

  const displayProps = edgeOnly
    ? props.filter((p) => hasEdge(p, evPropKeys))
    : props;

  if (displayProps.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
      {/* Player header */}
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <PlayerAvatar playerName={playerName} league={league} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-text-primary leading-tight truncate">
            {playerName}
          </p>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {displayProps.length} prop{displayProps.length !== 1 ? "s" : ""}
            {edgeOnly && props.length > displayProps.length && (
              <span className="text-text-tertiary/50">
                {" "}/ {props.length} total
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Prop rows */}
      <div className="border-t border-white/[0.04]">
        {displayProps.map((prop) => {
          const isExpanded = expandedProp === prop.propType;
          const overBetter =
            prop.bestOver && prop.bestUnder
              ? prop.bestOver.odds > prop.bestUnder.odds
              : false;
          const underBetter =
            prop.bestOver && prop.bestUnder
              ? prop.bestUnder.odds > prop.bestOver.odds
              : false;
          const isEV = evPropKeys?.has(
            `${prop.propType}|${prop.consensusLine}`,
          );

          return (
            <div
              key={prop.propType}
              className="border-b border-white/[0.04] last:border-b-0"
            >
              <div className="px-4 py-2.5 sm:px-5">
                {/* Prop type + line + edge flags */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-semibold text-text-primary">
                    {prop.propType}
                  </span>
                  <span className="text-xs tabular-nums text-text-secondary">
                    {prop.consensusLine}
                  </span>

                  {/* Edge flags */}
                  {prop.hasLineDiscrepancy && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-neon-yellow/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-neon-yellow ring-1 ring-neon-yellow/20">
                      <AlertTriangle size={10} />
                      LINE
                    </span>
                  )}
                  {prop.hasOddsDiscrepancy && (
                    <span className="rounded bg-blue-400/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-400/20">
                      VALUE
                    </span>
                  )}
                  {isEV && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-neon-green/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-neon-green ring-1 ring-neon-green/20">
                      <TrendingUp size={10} />
                      +EV
                    </span>
                  )}
                </div>

                {/* Over / Under compact row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Over */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5",
                      overBetter
                        ? "bg-neon-green/[0.06] ring-1 ring-neon-green/15"
                        : "bg-white/[0.025] ring-1 ring-white/[0.05]",
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Over
                    </span>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-base font-[900] tabular-nums",
                          overBetter ? "text-neon-green" : "text-text-primary",
                        )}
                      >
                        {prop.bestOver ? formatOdds(prop.bestOver.odds) : "\u2014"}
                      </span>
                      {prop.bestOver && (
                        <span className="ml-1.5 text-[10px] text-text-tertiary">
                          {abbreviateBookmaker(prop.bestOver.bookmaker)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Under */}
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5",
                      underBetter
                        ? "bg-neon-green/[0.06] ring-1 ring-neon-green/15"
                        : "bg-white/[0.025] ring-1 ring-white/[0.05]",
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Under
                    </span>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-base font-[900] tabular-nums",
                          underBetter ? "text-neon-green" : "text-text-primary",
                        )}
                      >
                        {prop.bestUnder
                          ? formatOdds(prop.bestUnder.odds)
                          : "\u2014"}
                      </span>
                      {prop.bestUnder && (
                        <span className="ml-1.5 text-[10px] text-text-tertiary">
                          {abbreviateBookmaker(prop.bestUnder.bookmaker)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand toggle for bookmaker breakdown */}
                {prop.lines.length > 1 && (
                  <button
                    onClick={() =>
                      setExpandedProp(isExpanded ? null : prop.propType)
                    }
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded py-0.5 text-[11px] font-medium text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary transition-colors"
                  >
                    {isExpanded ? "Hide" : `${prop.lines.length}`} books
                    <ChevronDown
                      size={12}
                      className={cn(
                        "transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Expanded bookmaker details */}
              {isExpanded && prop.lines.length > 1 && (
                <div className="border-t border-white/[0.03] bg-white/[0.01] px-4 py-2 sm:px-5">
                  <div className="space-y-1">
                    {prop.lines.map((l) => (
                      <div
                        key={l.bookmaker}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-text-secondary">
                          {abbreviateBookmaker(l.bookmaker)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-text-tertiary tabular-nums">
                            {l.hdp}
                          </span>
                          <span
                            className={cn(
                              "w-12 text-right font-mono tabular-nums",
                              prop.bestOver?.bookmaker === l.bookmaker &&
                                prop.bestOver?.odds === l.over
                                ? "text-neon-green"
                                : "text-text-primary",
                            )}
                          >
                            {formatOdds(l.over)}
                          </span>
                          <span
                            className={cn(
                              "w-12 text-right font-mono tabular-nums",
                              prop.bestUnder?.bookmaker === l.bookmaker &&
                                prop.bestUnder?.odds === l.under
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
        })}
      </div>
    </div>
  );
}
