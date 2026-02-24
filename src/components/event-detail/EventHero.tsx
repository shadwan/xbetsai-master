"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";
import { getTeamNames, getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import { getTeamMeta } from "@/src/lib/utils/espn-ids";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { TeamLogo } from "@/src/components/TeamLogo";
import { LeagueLogo } from "@/src/components/LeagueLogo";
import { LiveBadge } from "@/src/components/LiveBadge";
import { Skeleton } from "@/src/components/Skeleton";
import { useTeamInfo } from "@/src/lib/hooks/use-team-info";

interface EventHeroProps {
  event: ConsolidatedOddsEvent;
}

function formatHeroDate(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);

  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (d >= todayStart && d < tomorrowStart) {
    return { date: "Today", time };
  }

  const date = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return { date, time };
}

export function EventHero({ event }: EventHeroProps) {
  const { home, away } = getTeamNames(event.event);
  const leagueSlug = getLeagueSlug(event.event);

  const awayMeta = getTeamMeta(leagueSlug, away);
  const homeMeta = getTeamMeta(leagueSlug, home);

  const awayLocation = awayMeta?.location ?? (away.split(/\s+/).slice(0, -1).join(" ") || away);
  const awayNickname = awayMeta?.nickname ?? (away.split(/\s+/).pop() ?? away);
  const homeLocation = homeMeta?.location ?? (home.split(/\s+/).slice(0, -1).join(" ") || home);
  const homeNickname = homeMeta?.nickname ?? (home.split(/\s+/).pop() ?? home);

  const awayColor = awayMeta?.color ?? "#556677";
  const homeColor = homeMeta?.color ?? "#556677";

  const sport = SPORTS.find((s) => s.leagueSlug === leagueSlug);
  const leagueDisplay = sport?.displayName ?? leagueSlug;

  const startTime = getStartTime(event.event);

  // ESPN team info (record + standing)
  const awayInfo = useTeamInfo(leagueSlug, away);
  const homeInfo = useTeamInfo(leagueSlug, home);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const live =
    event.event.status === "live" ||
    (startTime ? now >= new Date(startTime).getTime() : false);

  const { date, time } = formatHeroDate(startTime);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border-bright/50 bg-[#0a1018]">
      {/* ── Team color background gradients ──────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-y-0 left-0 w-1/2"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 10% 50%, ${awayColor}12 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 90% 50%, ${homeColor}12 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ── Watermark logos (large, behind content) ─────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-[0.06]"
          style={{
            maskImage: "linear-gradient(to right, black 10%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to right, black 10%, transparent 80%)",
          }}
        >
          <TeamLogo league={leagueSlug} teamName={away} size={280} />
        </div>
        <div
          className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-[0.06]"
          style={{
            maskImage: "linear-gradient(to left, black 10%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 80%)",
          }}
        >
          <TeamLogo league={leagueSlug} teamName={home} size={280} />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative z-10">
        {/* Top bar: back + league badge */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
              "text-sm font-medium text-text-secondary",
              "transition-colors hover:bg-white/5 hover:text-text-primary",
            )}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/[0.06]">
            <LeagueLogo league={leagueSlug} size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {leagueDisplay}
            </span>
          </div>
        </div>

        {/* Matchup layout */}
        <div className="flex items-start justify-center gap-4 px-4 pb-5 pt-4 sm:gap-8 sm:px-8 sm:pt-6">
          {/* Away team */}
          <div className="flex flex-1 flex-col items-center gap-2 sm:gap-3">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: awayColor }}
              />
              <TeamLogo
                league={leagueSlug}
                teamName={away}
                size={88}
                className="relative drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] max-sm:!w-16 max-sm:!h-16"
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary sm:text-sm">
                {awayLocation}
              </p>
              <p className="text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-2xl">
                {awayNickname}
              </p>
              {/* Current Standing block */}
              {(awayInfo.isLoading || awayInfo.record || awayInfo.standing) && (
                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/70 sm:text-[11px]">
                    Current Standing
                  </span>
                  {awayInfo.isLoading ? (
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-3.5 w-20 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  ) : (
                    <>
                      {awayInfo.record && (
                        <p className="text-xs tabular-nums text-text-secondary sm:text-sm">
                          <span className="text-text-tertiary">Record: </span>
                          <span className="font-semibold text-text-primary">{awayInfo.record}</span>
                        </p>
                      )}
                      {awayInfo.standing && (
                        <p className="text-[11px] text-text-tertiary sm:text-xs">
                          {awayInfo.standing}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center divider: VS or Live badge or date/time */}
          <div className="flex shrink-0 flex-col items-center gap-1.5 pt-6 sm:pt-8">
            {live ? (
              <LiveBadge className="scale-110" />
            ) : (
              <>
                <span className="text-3xl font-black tracking-widest text-neon-gold/40 sm:text-4xl">
                  VS
                </span>
                <div className="flex flex-col items-center gap-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary sm:text-xs">
                    {date}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-text-secondary sm:text-base">
                    {time}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Home team */}
          <div className="flex flex-1 flex-col items-center gap-2 sm:gap-3">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: homeColor }}
              />
              <TeamLogo
                league={leagueSlug}
                teamName={home}
                size={88}
                className="relative drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] max-sm:!w-16 max-sm:!h-16"
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary sm:text-sm">
                {homeLocation}
              </p>
              <p className="text-lg font-extrabold leading-tight tracking-tight text-text-primary sm:text-2xl">
                {homeNickname}
              </p>
              {/* Current Standing block */}
              {(homeInfo.isLoading || homeInfo.record || homeInfo.standing) && (
                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/70 sm:text-[11px]">
                    Current Standing
                  </span>
                  {homeInfo.isLoading ? (
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-3.5 w-20 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  ) : (
                    <>
                      {homeInfo.record && (
                        <p className="text-xs tabular-nums text-text-secondary sm:text-sm">
                          <span className="text-text-tertiary">Record: </span>
                          <span className="font-semibold text-text-primary">{homeInfo.record}</span>
                        </p>
                      )}
                      {homeInfo.standing && (
                        <p className="text-[11px] text-text-tertiary sm:text-xs">
                          {homeInfo.standing}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-neon-gold/20 to-transparent" />
      </div>
    </section>
  );
}
