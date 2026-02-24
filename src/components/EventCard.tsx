"use client";

import { cn } from "@/lib/utils";
import type { ConsolidatedOddsEvent, ArbitrageBet, ValueBet } from "@/src/lib/odds-api/types";
import { getTeamNames, getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import { getTeamParts } from "@/src/lib/utils/team-abbrevs";
import { LiveBadge } from "./LiveBadge";
import { EVBadge } from "./EVBadge";
import { ArbBadge } from "./ArbBadge";
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

function formatDateLine(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { date, time };
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

  const { date, time } = formatDateLine(getStartTime(event.event));

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border transition-all duration-300",
      "bg-[#0d1520] hover:shadow-[0_0_40px_rgba(241,225,133,0.06)]",
      hasArb
        ? "border-neon-yellow/30 hover:border-neon-yellow/50"
        : hasEdge
          ? "border-neon-green/25 hover:border-neon-green/40"
          : "border-[#1e2d3d] hover:border-[#2a4055]",
    )}>
      {/* Background watermark logos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-[0.12]">
          <TeamLogo league={leagueSlug} teamName={away} size={200} />
        </div>
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.12]">
          <TeamLogo league={leagueSlug} teamName={home} size={200} />
        </div>
        {/* Radial overlay to fade edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0d1520_75%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top: date/time + signal badges */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
          <div className="flex items-center gap-1.5">
            {hasEdge && <EVBadge valuePercentage={eventValueBet.valuePercentage} />}
            {hasArb && <ArbBadge profitPercentage={eventArbBet.profitPercentage} />}
          </div>
          {live ? (
            <LiveBadge />
          ) : (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {date}
              </p>
              <p className="text-base font-extrabold text-text-primary">{time}</p>
            </div>
          )}
        </div>

        {/* Matchup hero */}
        <div className="flex items-center justify-between px-5 pb-5 pt-1">
          {/* Away team */}
          <div className="flex flex-col items-center gap-2.5 min-w-0 flex-1">
            <TeamLogo league={leagueSlug} teamName={away} size={60} />
            <div className="text-center">
              <p className="text-[11px] font-semibold text-text-secondary leading-tight">
                {awayParts.location}
              </p>
              <p className="text-[15px] font-extrabold text-text-primary leading-tight tracking-tight">
                {awayParts.nickname}
              </p>
            </div>
          </div>

          {/* VS divider */}
          <div className="flex shrink-0 items-center justify-center mx-3">
            <span className="text-lg font-black tracking-wider text-neon-gold/60">
              VS
            </span>
          </div>

          {/* Home team */}
          <div className="flex flex-col items-center gap-2.5 min-w-0 flex-1">
            <TeamLogo league={leagueSlug} teamName={home} size={60} />
            <div className="text-center">
              <p className="text-[11px] font-semibold text-text-secondary leading-tight">
                {homeParts.location}
              </p>
              <p className="text-[15px] font-extrabold text-text-primary leading-tight tracking-tight">
                {homeParts.nickname}
              </p>
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
