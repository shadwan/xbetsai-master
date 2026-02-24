"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "./EventCard";
import { LeagueLogo } from "./LeagueLogo";
import { OddsGridSkeleton } from "./Skeleton";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import type { ConsolidatedOddsEvent, ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function isLive(event: ConsolidatedOddsEvent, now: number): boolean {
  if (event.event.status === "live") return true;
  const st = getStartTime(event.event);
  if (!st) return false;
  return now >= new Date(st).getTime();
}

/** Get the Monday 00:00 for the week containing `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

interface TimeBucket {
  key: string;
  label: string;
  events: ConsolidatedOddsEvent[];
  isLive?: boolean;
}

function computeWeekBuckets(
  sorted: ConsolidatedOddsEvent[],
  now: number,
): TimeBucket[] {
  const buckets: TimeBucket[] = [];

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const tomorrowMs = todayMs + 86_400_000;

  const live: ConsolidatedOddsEvent[] = [];
  const today: ConsolidatedOddsEvent[] = [];
  const future: ConsolidatedOddsEvent[] = [];

  for (const e of sorted) {
    if (isLive(e, now)) {
      live.push(e);
      continue;
    }
    const st = new Date(getStartTime(e.event)).getTime();
    if (isNaN(st)) continue;
    if (st >= todayMs && st < tomorrowMs) {
      today.push(e);
    } else if (st >= tomorrowMs) {
      future.push(e);
    }
    // past non-live events are skipped
  }

  if (live.length > 0) {
    buckets.push({ key: "live", label: "Live", events: live, isLive: true });
  }
  if (today.length > 0) {
    buckets.push({ key: "today", label: "Today", events: today });
  }

  // Group future events by week (Mon–Sun)
  if (future.length > 0) {
    const weekMap = new Map<string, { monday: Date; events: ConsolidatedOddsEvent[] }>();

    for (const e of future) {
      const st = new Date(getStartTime(e.event));
      const monday = getMonday(st);
      const key = monday.toISOString().split("T")[0];

      if (!weekMap.has(key)) {
        weekMap.set(key, { monday, events: [] });
      }
      weekMap.get(key)!.events.push(e);
    }

    const thisMonday = getMonday(new Date(now));
    const thisMondayKey = thisMonday.toISOString().split("T")[0];

    const sortedWeeks = Array.from(weekMap.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    for (const [key, { monday, events }] of sortedWeeks) {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);

      let label: string;
      if (key === thisMondayKey) {
        label = "This Week";
      } else {
        const sm = monday.toLocaleString("en-US", { month: "short" });
        const em = sunday.toLocaleString("en-US", { month: "short" });
        if (sm === em) {
          label = `${sm} ${monday.getDate()}\u2013${sunday.getDate()}`;
        } else {
          label = `${sm} ${monday.getDate()} \u2013 ${em} ${sunday.getDate()}`;
        }
      }

      buckets.push({ key, label, events });
    }
  }

  return buckets;
}

// ── Component ───────────────────────────────────────────────────────────────

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

export function EventListing({
  odds,
  isLoading,
  valueBets,
  arbBets,
  singleLeague,
  todayOnly,
}: EventListingProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [activeBucketKey, setActiveBucketKey] = useState<string | null>(null);

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
      return (
        new Date(getStartTime(a.event)).getTime() -
        new Date(getStartTime(b.event)).getTime()
      );
    });
  }, [odds, now]);

  // todayOnly mode: flat list of live + today
  const todayEvents = useMemo(() => {
    if (!todayOnly) return [];
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const tomorrowMs = todayMs + 86_400_000;

    return sortedOdds.filter((e) => {
      if (isLive(e, now)) return true;
      const st = new Date(getStartTime(e.event)).getTime();
      return st >= todayMs && st < tomorrowMs;
    });
  }, [sortedOdds, now, todayOnly]);

  // Week buckets mode: for subpages
  const buckets = useMemo(() => {
    if (todayOnly) return [];
    return computeWeekBuckets(sortedOdds, now);
  }, [sortedOdds, now, todayOnly]);

  // Resolve active bucket
  const activeBucket = useMemo(() => {
    if (todayOnly) return null;
    if (buckets.length === 0) return null;
    if (activeBucketKey) {
      const found = buckets.find((b) => b.key === activeBucketKey);
      if (found) return found;
    }
    return buckets[0]; // default to first (Live if exists, else Today, else first week)
  }, [buckets, activeBucketKey, todayOnly]);

  const filteredOdds = todayOnly
    ? todayEvents
    : activeBucket?.events ?? [];

  // Group by league (for multi-league / home view)
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
      {/* Week pills — shown on subpages */}
      {!todayOnly && buckets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {buckets.map((bucket) => (
            <button
              key={bucket.key}
              onClick={() => setActiveBucketKey(bucket.key)}
              className={`flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeBucket?.key === bucket.key
                  ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                  : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary"
              }`}
            >
              {bucket.isLive && (
                <span className="relative mr-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
              {bucket.label}
              <span className="ml-1.5 text-xs opacity-60">
                {bucket.events.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {isLoading && <OddsGridSkeleton rows={6} />}

      {!isLoading && filteredOdds.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <p className="text-text-secondary">
            {todayOnly ? "No events today." : "No events found."}
          </p>
        </div>
      )}

      {!isLoading && filteredOdds.length > 0 && singleLeague && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOdds.map((e) => (
            <Link
              key={e.event.id}
              href={`/events/${e.event.id}`}
              className="block"
            >
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
                  <Link
                    key={e.event.id}
                    href={`/events/${e.event.id}`}
                    className="block"
                  >
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
