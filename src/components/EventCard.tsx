"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ConsolidatedOddsEvent, ArbitrageBet, ValueBet } from "@/src/lib/odds-api/types";
import { getTeamNames, getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import { getTeamParts } from "@/src/lib/utils/team-abbrevs";
import { computeMarketConsensus } from "@/src/lib/utils/predictions";
import { MotionIcon } from "motion-icons-react";
import { LiveBadge } from "./LiveBadge";
import { PredictionBar } from "./PredictionBar";
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

  const { label: dateLabel, sublabel, time } = formatDateLine(getStartTime(event.event));
  const consensus = useMemo(() => computeMarketConsensus(event), [event]);

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
        {/* Top: signal badges */}
        {(hasEdge || hasArb || live) && (
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
            {hasEdge && (
              <span
                className="flex items-center gap-1 rounded-full bg-neon-green/10 px-2 py-0.5 ring-1 ring-neon-green/25"
                title="+EV Opportunity"
              >
                <span className="text-[10px] font-extrabold tracking-wide text-neon-green">+EV</span>
              </span>
            )}
            {hasArb && (
              <span
                className="flex items-center gap-1 rounded-full bg-neon-yellow/10 px-2 py-0.5 ring-1 ring-neon-yellow/25"
                title="Sure — Guaranteed Profit"
              >
                <MotionIcon name="Trophy" size={14} color="var(--color-neon-yellow)" animation="none" />
                <span className="text-[10px] font-extrabold tracking-wide text-neon-yellow">SURE</span>
              </span>
            )}
            {live && <LiveBadge />}
          </div>
        )}

        {/* Date & time — centered between top and matchup */}
        {!live && (
          <div className="flex flex-col items-center pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                {dateLabel}
              </span>
              <span className="text-text-tertiary/50">·</span>
              <span className="text-sm font-extrabold text-text-primary">
                {time}
              </span>
            </div>
            {sublabel && (
              <span className="text-[10px] font-medium text-text-tertiary">
                {sublabel}
              </span>
            )}
          </div>
        )}

        {/* Matchup hero */}
        <div className={cn(
          "flex items-center justify-between px-5 pb-5",
          live && !hasEdge && !hasArb ? "pt-4" : "pt-1",
        )}>
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

        {/* Market consensus prediction bar */}
        {consensus && (
          <PredictionBar consensus={consensus} className="px-5 pb-3" />
        )}

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
