"use client";

import { useId } from "react";
import type { MarketConsensus } from "@/src/lib/utils/predictions";

interface PredictionBarProps {
  consensus: MarketConsensus;
  className?: string;
}

// ── Arc geometry (120° arc — compact and elegant) ────────────────────────────

const R = 48;
const CX = 100;
const CY = 55;
const START_DEG = 150; // left endpoint angle (degrees from +x, CCW)
const SWEEP_DEG = 120; // total arc sweep
const ARC_LEN = (SWEEP_DEG / 360) * 2 * Math.PI * R; // ≈ 100.53

// Endpoint positions (calculated from angles)
const toRad = (deg: number) => (deg * Math.PI) / 180;
const LX = CX + R * Math.cos(toRad(START_DEG)); // ≈ 58.4
const LY = CY - R * Math.sin(toRad(START_DEG)); // ≈ 31
const RX = CX + R * Math.cos(toRad(START_DEG - SWEEP_DEG)); // ≈ 141.6
const RY = CY - R * Math.sin(toRad(START_DEG - SWEEP_DEG)); // ≈ 31

// Colors
const GOLD = "#F1E185";
const GOLD_DIM = "#D4AF37";
const DARK = "#1c2a3a";
const MUTED = "rgba(85,102,119,0.45)";

// ── Component ────────────────────────────────────────────────────────────────

export function PredictionBar({ consensus, className }: PredictionBarProps) {
  const uid = useId().replace(/:/g, "");
  const { home, away } = consensus;

  const homePct = Math.round(home.probability * 100);
  const awayPct = Math.round(away.probability * 100);
  const awayIsFav = away.probability >= home.probability;

  // Marker position: t ∈ [0,1] maps along the arc from left to right
  const t = away.probability;
  const angle = toRad(START_DEG - t * SWEEP_DEG);
  const mx = CX + R * Math.cos(angle);
  const my = CY - R * Math.sin(angle);

  const favPct = awayIsFav ? away.probability : home.probability;

  // SVG paths
  const pathLR = `M ${LX} ${LY} A ${R} ${R} 0 0 1 ${RX} ${RY}`;
  const pathRL = `M ${RX} ${RY} A ${R} ${R} 0 0 0 ${LX} ${LY}`;

  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 68"
        className="w-full h-auto"
        role="img"
        aria-label={`Win probability: ${consensus.away.name} ${awayPct}%, ${consensus.home.name} ${homePct}%`}
      >
        <defs>
          {/* Soft blur for arc glow */}
          <filter id={`${uid}g`}>
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          {/* Sharper glow for marker dot */}
          <filter id={`${uid}d`}>
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Text glow */}
          <filter id={`${uid}t`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* ── Background arc ─────────────────────────────────────────── */}
        <path
          d={pathLR}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* ── Glow layer behind favorite segment ─────────────────────── */}
        <path
          d={awayIsFav ? pathLR : pathRL}
          fill="none"
          stroke={GOLD}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN * favPct} ${ARC_LEN}`}
          filter={`url(#${uid}g)`}
          opacity="0.25"
        />

        {/* ── Away arc segment (from left) ───────────────────────────── */}
        <path
          d={pathLR}
          fill="none"
          stroke={awayIsFav ? GOLD : DARK}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN * away.probability} ${ARC_LEN}`}
        />

        {/* ── Home arc segment (from right, reversed path) ───────────── */}
        <path
          d={pathRL}
          fill="none"
          stroke={!awayIsFav ? GOLD : DARK}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN * home.probability} ${ARC_LEN}`}
        />

        {/* ── Marker dot ─────────────────────────────────────────────── */}
        {/* Outer glow */}
        <circle
          cx={mx} cy={my} r="6.5"
          fill={GOLD}
          filter={`url(#${uid}d)`}
          opacity="0.4"
        />
        {/* Solid body */}
        <circle cx={mx} cy={my} r="4" fill={GOLD} />
        {/* Bright center */}
        <circle cx={mx} cy={my} r="1.8" fill="#fffbe6" />

        {/* ── Percentage text: FAVORITE glow layer ───────────────────── */}
        <text
          x={awayIsFav ? LX : RX}
          y={LY + 24}
          textAnchor={awayIsFav ? "start" : "end"}
          fill={GOLD}
          fontSize="15"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          filter={`url(#${uid}t)`}
          opacity="0.5"
        >
          {awayIsFav ? `${awayPct}%` : `${homePct}%`}
        </text>

        {/* ── Away percentage ────────────────────────────────────────── */}
        <text
          x={LX}
          y={LY + 24}
          textAnchor="start"
          fill={awayIsFav ? GOLD : MUTED}
          fontSize={awayIsFav ? "15" : "11.5"}
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {awayPct}%
        </text>

        {/* ── Home percentage ────────────────────────────────────────── */}
        <text
          x={RX}
          y={LY + 24}
          textAnchor="end"
          fill={!awayIsFav ? GOLD : MUTED}
          fontSize={!awayIsFav ? "15" : "11.5"}
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {homePct}%
        </text>

        {/* ── Center label ───────────────────────────────────────────── */}
        <text
          x={CX}
          y={LY + 24}
          textAnchor="middle"
          fill="rgba(85,102,119,0.25)"
          fontSize="5.5"
          fontWeight="700"
          letterSpacing="0.18em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          WIN PROB
        </text>
      </svg>
    </div>
  );
}
