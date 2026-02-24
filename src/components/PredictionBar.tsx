"use client";

import type { MarketConsensus } from "@/src/lib/utils/predictions";

interface PredictionBarProps {
  consensus: MarketConsensus;
  className?: string;
}

export function PredictionBar({ consensus, className }: PredictionBarProps) {
  const { home, away, draw } = consensus;

  const homePct = Math.round(home.probability * 100);
  const awayPct = Math.round(away.probability * 100);
  const drawPct = draw ? Math.round(draw.probability * 100) : 0;

  // Ensure displayed percentages sum to 100
  const total = homePct + awayPct + drawPct;
  const adjustedHome = homePct + (100 - total); // absorb rounding error

  const favorite = home.probability >= away.probability ? "home" : "away";

  return (
    <div className={className}>
      {/* Percentage labels */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[11px] font-bold text-text-secondary">
          {awayPct}%
        </span>
        {drawPct > 0 && (
          <span className="text-[10px] font-semibold text-text-tertiary">
            {drawPct}%
          </span>
        )}
        <span className="text-[11px] font-bold text-text-secondary">
          {adjustedHome}%
        </span>
      </div>

      {/* Bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        {/* Away segment (left) */}
        <div
          className="transition-all duration-500"
          style={{
            width: `${awayPct}%`,
            backgroundColor: favorite === "away" ? "#22d3ee" : "#334155",
          }}
        />
        {/* Draw segment (middle, if exists) */}
        {drawPct > 0 && (
          <div
            className="transition-all duration-500"
            style={{
              width: `${drawPct}%`,
              backgroundColor: "#475569",
            }}
          />
        )}
        {/* Home segment (right) */}
        <div
          className="transition-all duration-500"
          style={{
            width: `${adjustedHome}%`,
            backgroundColor: favorite === "home" ? "#22d3ee" : "#334155",
          }}
        />
      </div>
    </div>
  );
}
