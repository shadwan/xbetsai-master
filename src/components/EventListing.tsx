"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "./EventCard";
import { LeagueLogo } from "./LeagueLogo";
import { OddsGridSkeleton } from "./Skeleton";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import type { ConsolidatedOddsEvent, ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";

type TimeFilter = "live" | "today" | "upcoming";

const TIME_FILTERS: TimeFilter[] = ["live", "today", "upcoming"];
const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  live: "Live",
  today: "Today",
  upcoming: "Upcoming",
};

function isLive(event: ConsolidatedOddsEvent, now: number): boolean {
  if (event.event.status === "live") return true;
  const st = getStartTime(event.event);
  if (!st) return false;
  return now >= new Date(st).getTime();
}

function classifyEvent(e: ConsolidatedOddsEvent, now: number): TimeFilter | null {
  if (isLive(e, now)) return "live";
  const st = new Date(getStartTime(e.event)).getTime();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const tomorrowMs = todayMs + 86_400_000;
  const dayAfterMs = tomorrowMs + 86_400_000;
  if (st >= todayMs && st < tomorrowMs) return "today";
  if (st >= tomorrowMs && st < dayAfterMs) return "upcoming";
  return null;
}

interface EventListingProps {
  odds: ConsolidatedOddsEvent[] | undefined;
  isLoading: boolean;
  valueBets: ValueBet[] | undefined;
  arbBets: ArbitrageBet[] | undefined;
  /** When true, skip per-league group headers (used on single-league pages). */
  singleLeague?: boolean;
  /** When true, only show live + today events with no time filter buttons (home page). */
  todayOnly?: boolean;
}

export function EventListing({ odds, isLoading, valueBets, arbBets, singleLeague, todayOnly }: EventListingProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(null);

  const valueBetsByEvent = useMemo(() => {
    const map = new Map<string, ValueBet[]>();
    if (!valueBets) return map;
    for (const vb of valueBets) {
      const arr = map.get(vb.eventId) ?? [];
      arr.push(vb);
      map.set(vb.eventId, arr);
    }
    return map;
  }, [valueBets]);

  const arbBetsByEvent = useMemo(() => {
    const map = new Map<string, ArbitrageBet[]>();
    if (!arbBets) return map;
    for (const ab of arbBets) {
      const arr = map.get(ab.eventId) ?? [];
      arr.push(ab);
      map.set(ab.eventId, arr);
    }
    return map;
  }, [arbBets]);

  const sortedOdds = useMemo(() => {
    if (!odds) return [];
    return [...odds].sort((a, b) => {
      const aLive = isLive(a, now);
      const bLive = isLive(b, now);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(getStartTime(a.event)).getTime() - new Date(getStartTime(b.event)).getTime();
    });
  }, [odds, now]);

  const { timeCounts, filteredOdds, activeTimeFilter } = useMemo(() => {
    const counts: Record<TimeFilter, number> = { live: 0, today: 0, upcoming: 0 };
    const buckets: Record<TimeFilter, ConsolidatedOddsEvent[]> = {
      live: [], today: [], upcoming: [],
    };
    for (const e of sortedOdds) {
      const cat = classifyEvent(e, now);
      if (!cat) continue;
      counts[cat]++;
      buckets[cat].push(e);
    }

    if (todayOnly) {
      // Combine live + today, no filter buttons
      const combined = [...buckets.live, ...buckets.today];
      return { timeCounts: counts, filteredOdds: combined, activeTimeFilter: "today" as TimeFilter };
    }

    const auto: TimeFilter = counts.live > 0 ? "live"
      : counts.today > 0 ? "today"
      : "upcoming";
    const effective = timeFilter ?? auto;
    return { timeCounts: counts, filteredOdds: buckets[effective] ?? [], activeTimeFilter: effective };
  }, [sortedOdds, now, timeFilter, todayOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, ConsolidatedOddsEvent[]>();
    for (const e of filteredOdds) {
      const league = getLeagueSlug(e.event) || "unknown";
      const arr = map.get(league) ?? [];
      arr.push(e);
      map.set(league, arr);
    }
    return map;
  }, [filteredOdds]);

  const leagueDisplayName = (slug: string) =>
    SPORTS.find((s) => s.leagueSlug === slug)?.displayName ?? slug;

  return (
    <>
      {/* Time filter buttons — hidden when todayOnly */}
      {!todayOnly && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TIME_FILTERS.filter((tf) => timeCounts[tf] > 0).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTimeFilter === tf
                  ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                  : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary"
              }`}
            >
              {tf === "live" && (
                <span className="relative mr-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
              {TIME_FILTER_LABELS[tf]}
              <span className="ml-1.5 text-xs opacity-60">{timeCounts[tf]}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && <OddsGridSkeleton rows={6} />}

      {!isLoading && filteredOdds.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <p className="text-text-secondary">
            {todayOnly
              ? "No events today."
              : `No ${TIME_FILTER_LABELS[activeTimeFilter].toLowerCase()} events${sortedOdds.length > 0 ? " — try another time filter" : " found"}.`}
          </p>
        </div>
      )}

      {!isLoading && filteredOdds.length > 0 && singleLeague && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOdds.map((e) => (
            <Link key={e.event.id} href={`/events/${e.event.id}`} className="block">
              <EventCard
                event={e}
                valueBets={valueBetsByEvent.get(String(e.event.id))}
                arbBets={arbBetsByEvent.get(String(e.event.id))}
              />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && filteredOdds.length > 0 && !singleLeague && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([league, events]) => (
            <section key={league}>
              <div className="mb-4 flex items-center gap-2.5">
                <LeagueLogo league={league} size={24} />
                <h2 className="text-base font-bold text-text-primary uppercase tracking-wide">
                  {leagueDisplayName(league)}
                </h2>
                <span className="text-xs font-medium text-text-tertiary">
                  {events.length} {events.length === 1 ? "game" : "games"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <Link key={e.event.id} href={`/events/${e.event.id}`} className="block">
                    <EventCard
                      event={e}
                      valueBets={valueBetsByEvent.get(String(e.event.id))}
                      arbBets={arbBetsByEvent.get(String(e.event.id))}
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
