import Image from "next/image";

const LEAGUE_LOGO_MAP: Record<string, string> = {
  "usa-nba": "/logos/leagues/nba.png",
  "usa-nfl": "/logos/leagues/nfl.png",
  "usa-mlb": "/logos/leagues/mlb.png",
  "usa-nhl": "/logos/leagues/nhl.png",
};

interface LeagueLogoProps {
  league: string;
  size?: number;
}

export function LeagueLogo({ league, size = 20 }: LeagueLogoProps) {
  const src = LEAGUE_LOGO_MAP[league];

  if (src) {
    return (
      <Image
        src={src}
        alt={league}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        unoptimized
      />
    );
  }

  // NCAA fallback — text badge
  const label = league === "usa-ncaaf" ? "CFB" : league === "usa-ncaab" ? "CBB" : "NCAA";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded bg-elevated text-[9px] font-bold text-text-secondary"
      style={{ width: size, height: size }}
    >
      {label}
    </span>
  );
}
