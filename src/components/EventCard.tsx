"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ConsolidatedOddsEvent, ArbitrageBet, ValueBet } from "@/src/lib/odds-api/types";
import { getTeamNames, getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import { getTeamParts } from "@/src/lib/utils/team-abbrevs";
import { computeMarketConsensus } from "@/src/lib/utils/predictions";
import { MotionIcon } from "motion-icons-react";
import { LiveBadge } from "./LiveBadge";
import { Crown, Users } from "lucide-react";
import { TeamLogo } from "./TeamLogo";

interface EventCardProps {
  event: ConsolidatedOddsEvent;
  valueBets?: ValueBet[];
  arbBets?: ArbitrageBet[];
}

function isLive(event: ConsolidatedOddsEvent): boolean {
  if (event.event.status === "live") return true;
  const st = getStartTime(event.event);
  if (!st) return false;
  return Date.now() >= new Date(st).getTime();
}

function formatDateLine(isoString: string): { label: string; sublabel?: string; time: string } {
  if (!isoString) return { label: "", time: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { label: "", time: "" };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const dayAfterStart = new Date(tomorrowStart.getTime() + 86_400_000);
  const fullDate = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (d >= todayStart && d < tomorrowStart) {
    return { label: "Today", time };
  }
  if (d >= tomorrowStart && d < dayAfterStart) {
    return { label: "Tomorrow", sublabel: fullDate, time };
  }
  return { label: fullDate, time };
}

export function EventCard({ event, valueBets, arbBets }: EventCardProps) {
  const live = isLive(event);
  const { home, away } = getTeamNames(event.event);
  const leagueSlug = getLeagueSlug(event.event);
  const awayParts = getTeamParts(leagueSlug, away);
  const homeParts = getTeamParts(leagueSlug, home);

  const eid = String(event.event.id);
  const eventValueBet = valueBets?.find((vb) => vb.eventId === eid);
  const eventArbBet = arbBets?.find((ab) => ab.eventId === eid);
  const hasEdge = !!eventValueBet;
  const hasArb = !!eventArbBet;
  const hasProps = valueBets?.some(
    (vb) =>
      vb.eventId === eid &&
      (/^Player Props/i.test(vb.market) || /\s+O\/U$/i.test(vb.market)),
  );

  const { label: dateLabel, sublabel, time } = formatDateLine(getStartTime(event.event));
  const consensus = useMemo(() => computeMarketConsensus(event), [event]);

  const favorite = useMemo(() => {
    if (!consensus) return null;
    if (consensus.away.probability > consensus.home.probability) return "away" as const;
    if (consensus.home.probability > consensus.away.probability) return "home" as const;
    return null;
  }, [consensus]);

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border transition-all duration-300",
      "bg-[#0d1520] hover:shadow-[0_0_40px_rgba(241,225,133,0.06)]",
      hasArb
        ? "border-neon-yellow/30 hover:border-[#F1E185]/50"
        : hasEdge
          ? "border-neon-green/25 hover:border-[#F1E185]/50"
          : "border-[#1e2d3d] hover:border-[#F1E185]/40",
    )}>
      {/* Background watermark logos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-[0.20]"
          style={{ maskImage: "linear-gradient(to bottom right, black 15%, transparent 75%)", WebkitMaskImage: "linear-gradient(to bottom right, black 15%, transparent 75%)" }}
        >
          <TeamLogo league={leagueSlug} teamName={away} size={200} />
        </div>
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.20]"
          style={{ maskImage: "linear-gradient(to bottom left, black 15%, transparent 75%)", WebkitMaskImage: "linear-gradient(to bottom left, black 15%, transparent 75%)" }}
        >
          <TeamLogo league={leagueSlug} teamName={home} size={200} />
        </div>
        {/* Edge fades — top, bottom, and center seam */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1520] via-transparent to-[#0d1520] via-[15%]" style={{ backgroundSize: "100% 100%", backgroundImage: "linear-gradient(to bottom, #0d1520 0%, transparent 15%, transparent 85%, #0d1520 100%)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top row: badges + time (for today's events, time sits in same row) */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          {hasEdge && (
            <span
              className="flex items-center gap-1 rounded-full bg-neon-green/10 px-2.5 py-1 ring-1 ring-neon-green/25"
              title="+EV Opportunity"
            >
              <span className="text-sm font-extrabold tracking-wide text-neon-green">+EV</span>
            </span>
          )}
          {hasArb && (
            <span
              className="flex items-center gap-1 rounded-full bg-neon-yellow/10 px-2.5 py-1 ring-1 ring-neon-yellow/25"
              title="Sure — Guaranteed Profit"
            >
              <MotionIcon name="Trophy" size={16} color="var(--color-neon-yellow)" animation="none" />
              <span className="text-sm font-extrabold tracking-wide text-neon-yellow">SURE</span>
            </span>
          )}
          {hasProps && (
            <span
              className="flex items-center gap-1 rounded-full bg-neon-cyan/10 px-2.5 py-1 ring-1 ring-neon-cyan/25"
              title="Player Props Available"
            >
              <Users size={14} className="text-neon-cyan" />
              <span className="text-sm font-extrabold tracking-wide text-neon-cyan">PROPS</span>
            </span>
          )}
          {live && <LiveBadge />}
          {/* Today's time — pushed to the right */}
          {!live && dateLabel === "Today" && (
            <span className="ml-auto text-lg font-extrabold text-white/50">
              {time}
            </span>
          )}
        </div>

        {/* Win probability label — always rendered for consistent height, visible on hover only if consensus */}
        <div className={cn(
          "text-center pt-2 pb-0 transition-opacity duration-300",
          consensus ? "opacity-0 group-hover:opacity-100" : "opacity-0",
        )}>
          <span className="text-xs font-bold uppercase tracking-widest text-white/60 whitespace-nowrap">
            Win Probability · Market Consensus
          </span>
        </div>

        {/* Date & time row — only for non-today, non-live events */}
        {!live && dateLabel !== "Today" && (
          <div className="flex flex-col items-center pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold uppercase tracking-wide text-text-secondary">
                {dateLabel}
              </span>
              <span className="text-text-tertiary/50">·</span>
              <span className="text-lg font-extrabold text-text-primary">
                {time}
              </span>
            </div>
            {sublabel && (
              <span className="text-sm font-medium text-text-tertiary">
                {sublabel}
              </span>
            )}
          </div>
        )}

        {/* Matchup hero */}
        <div className={cn(
          "flex items-center justify-between px-6 pb-6",
          live && !hasEdge && !hasArb ? "pt-5" : "pt-2",
        )}>
          {/* Away team */}
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <TeamLogo league={leagueSlug} teamName={away} size={72} />
            <div className="text-center w-full overflow-hidden">
              <p className="text-sm font-semibold text-text-secondary leading-tight truncate max-w-full">
                {awayParts.location}
              </p>
              <p className="text-xl font-extrabold text-text-primary leading-tight tracking-tight truncate max-w-full">
                {awayParts.nickname}
              </p>
              {/* Crown + percentage below team name */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 mt-1 transition-opacity duration-300",
                  consensus ? "opacity-0 group-hover:opacity-100" : "opacity-0",
                )}
              >
                {favorite === "away" && (
                  <Crown
                    size={14}
                    className="text-[#F1E185] drop-shadow-[0_0_4px_rgba(241,225,133,0.6)] shrink-0"
                    fill="rgba(241,225,133,0.3)"
                    strokeWidth={2.5}
                    aria-label="Predicted favorite"
                  />
                )}
                <span
                  className="text-base font-[900] tabular-nums leading-none whitespace-nowrap drop-shadow-[0_0_6px_rgba(241,225,133,0.5)]"
                  style={{ color: favorite === "away" ? "#F1E185" : "rgba(255,255,255,0.55)" }}
                >
                  {consensus ? `${Math.round(consensus.away.probability * 100)}%` : "0%"}
                </span>
              </span>
            </div>
          </div>

          {/* VS divider */}
          <div className="flex shrink-0 items-center justify-center mx-2">
            <span className="text-2xl font-black tracking-wider text-neon-gold/60">
              VS
            </span>
          </div>

          {/* Home team */}
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <TeamLogo league={leagueSlug} teamName={home} size={72} />
            <div className="text-center w-full overflow-hidden">
              <p className="text-sm font-semibold text-text-secondary leading-tight truncate max-w-full">
                {homeParts.location}
              </p>
              <p className="text-xl font-extrabold text-text-primary leading-tight tracking-tight truncate max-w-full">
                {homeParts.nickname}
              </p>
              {/* Crown + percentage below team name */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 mt-1 transition-opacity duration-300",
                  consensus ? "opacity-0 group-hover:opacity-100" : "opacity-0",
                )}
              >
                {favorite === "home" && (
                  <Crown
                    size={14}
                    className="text-[#F1E185] drop-shadow-[0_0_4px_rgba(241,225,133,0.6)] shrink-0"
                    fill="rgba(241,225,133,0.3)"
                    strokeWidth={2.5}
                    aria-label="Predicted favorite"
                  />
                )}
                <span
                  className="text-base font-[900] tabular-nums leading-none whitespace-nowrap drop-shadow-[0_0_6px_rgba(241,225,133,0.5)]"
                  style={{ color: favorite === "home" ? "#F1E185" : "rgba(255,255,255,0.55)" }}
                >
                  {consensus ? `${Math.round(consensus.home.probability * 100)}%` : "0%"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={cn(
          "h-[2px]",
          hasArb
            ? "bg-gradient-to-r from-transparent via-neon-yellow/40 to-transparent"
            : hasEdge
              ? "bg-gradient-to-r from-transparent via-neon-green/30 to-transparent"
              : "bg-gradient-to-r from-transparent via-neon-gold/15 to-transparent",
        )} />
      </div>
    </div>
  );
}
