"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import * as NBALogos from "react-nba-logos";
import * as NFLLogos from "react-nfl-logos";
import * as MLBLogos from "react-mlb-logos";
import * as NHLLogos from "react-nhl-logos";

// Suppress React DOM warnings for invalid SVG attributes in third-party logo packages
// (e.g. react-nhl-logos uses `enable-background` instead of `enableBackground`)
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Invalid DOM property")) return;
    origError.apply(console, args);
  };
}
import {
  getTeamAbbreviation,
  getSvgAbbreviation,
  getTeamColor,
  getLeagueFolder,
} from "@/src/lib/utils/team-abbrevs";

// ── SVG logo packages keyed by league slug ───────────────────────────────────

type LogoComponent = React.ComponentType<{ size?: number }>;

const LOGO_PACKAGES: Record<string, Record<string, LogoComponent>> = {
  "usa-nba": NBALogos as unknown as Record<string, LogoComponent>,
  "usa-nfl": NFLLogos as unknown as Record<string, LogoComponent>,
  "usa-mlb": MLBLogos as unknown as Record<string, LogoComponent>,
  "usa-nhl": NHLLogos as unknown as Record<string, LogoComponent>,
};

const PRO_LEAGUES = new Set(["usa-nba", "usa-nfl", "usa-mlb", "usa-nhl"]);

// ── Props ────────────────────────────────────────────────────────────────────

interface TeamLogoProps {
  league: string;
  teamName: string;
  size?: number;
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TeamLogo({
  league,
  teamName,
  size = 32,
  className,
}: TeamLogoProps) {
  const [pngFailed, setPngFailed] = useState(false);

  const isProLeague = PRO_LEAGUES.has(league);
  const svgAbbr = isProLeague ? getSvgAbbreviation(league, teamName) : null;
  const espnAbbr = getTeamAbbreviation(league, teamName);
  const folder = getLeagueFolder(league);

  // ── Tier 1: SVG (pro leagues only) ──────────────────────────────────────

  if (isProLeague && svgAbbr) {
    const SvgLogo = LOGO_PACKAGES[league]?.[svgAbbr];
    if (SvgLogo) {
      return (
        <span className={className} style={{ display: "inline-flex" }}>
          <SvgLogo size={size} />
        </span>
      );
    }
  }

  // ── Tier 2: PNG from public/logos/ ──────────────────────────────────────

  if (!pngFailed && espnAbbr && folder) {
    const src = `/logos/${folder}/${espnAbbr.toLowerCase()}-dark.png`;
    return (
      <Image
        src={src}
        alt={teamName}
        width={size}
        height={size}
        className={className}
        onError={() => setPngFailed(true)}
        unoptimized
      />
    );
  }

  // ── Tier 3: Colored initials fallback ──────────────────────────────────

  const color = getTeamColor(league, teamName) ?? "#556677";
  const initials = espnAbbr
    ? espnAbbr.slice(0, 3)
    : teamName
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
