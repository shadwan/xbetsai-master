"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { MarketToggle } from "@/src/components/MarketToggle";
import { EventCard } from "@/src/components/EventCard";
import { OddsGridSkeleton } from "@/src/components/Skeleton";
import { useOdds } from "@/src/lib/hooks/use-odds";
import { useEvents } from "@/src/lib/hooks/use-events";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import { useSSE } from "@/src/lib/hooks/use-sse";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { getStartTime, getLeagueSlug } from "@/src/lib/utils/odds";
import type { ConsolidatedOddsEvent, ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";
import type { Event } from "odds-api-io";

type MarketType = "ML" | "Spread" | "Totals";
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
  return null; // beyond tomorrow — excluded
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Header />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sport = searchParams.get("sport") ?? "all";
  const market = (searchParams.get("market") as MarketType) ?? "ML";

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [timeFilter, setTimeFilter] = useState<TimeFilter | null>(null);

  useSSE();

  const { data: oddsData, isLoading: oddsLoading } = useOdds(
    sport === "all" ? undefined : sport,
  );
  const { data: eventsData } = useEvents();
  const { data: valueBets } = useValueBets();
  const { data: arbBets } = useArbBets();

  function setSport(s: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "all") {
      params.delete("sport");
    } else {
      params.set("sport", s);
    }
    router.replace(`/?${params.toString()}`);
  }

  function setMarket(m: MarketType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("market", m);
    router.replace(`/?${params.toString()}`);
  }

  const eventCounts = useMemo(() => {
    if (!eventsData || Array.isArray(eventsData)) return undefined;
    const counts: Record<string, number> = {};
    for (const [key, events] of Object.entries(eventsData as Record<string, Event[]>)) {
      counts[key] = events.length;
    }
    return counts;
  }, [eventsData]);

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
    if (!oddsData) return [];
    return [...oddsData].sort((a, b) => {
      const aLive = isLive(a, now);
      const bLive = isLive(b, now);
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return new Date(getStartTime(a.event)).getTime() - new Date(getStartTime(b.event)).getTime();
    });
  }, [oddsData, now]);

  const { timeCounts, filteredOdds, activeTimeFilter } = useMemo(() => {
    const counts: Record<TimeFilter, number> = { live: 0, today: 0, upcoming: 0 };
    const buckets: Record<TimeFilter, ConsolidatedOddsEvent[]> = {
      live: [], today: [], upcoming: [],
    };
    for (const e of sortedOdds) {
      const cat = classifyEvent(e, now);
      if (!cat) continue; // beyond tomorrow, skip
      counts[cat]++;
      buckets[cat].push(e);
    }
    const auto: TimeFilter = counts.live > 0 ? "live"
      : counts.today > 0 ? "today"
      : "upcoming";
    const effective = timeFilter ?? auto;
    return { timeCounts: counts, filteredOdds: buckets[effective] ?? [], activeTimeFilter: effective };
  }, [sortedOdds, now, timeFilter]);

  const grouped = useMemo(() => {
    if (sport !== "all") return null;
    const map = new Map<string, ConsolidatedOddsEvent[]>();
    for (const e of filteredOdds) {
      const league = getLeagueSlug(e.event) || "unknown";
      const arr = map.get(league) ?? [];
      arr.push(e);
      map.set(league, arr);
    }
    return map;
  }, [sport, filteredOdds]);

  const leagueDisplayName = (slug: string) =>
    SPORTS.find((s) => s.leagueSlug === slug)?.displayName ?? slug;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSport("all")}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                sport === "all"
                  ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                  : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary"
              }`}
            >
              All
            </button>
            <SportTabs
              activeSport={sport}
              onSportChange={setSport}
              eventCounts={eventCounts ?? undefined}
            />
          </div>
          <MarketToggle active={market} onChange={setMarket} />
        </div>

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

        {oddsLoading && <OddsGridSkeleton rows={6} />}

        {!oddsLoading && filteredOdds.length === 0 && (
          <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <p className="text-text-secondary">
              No {TIME_FILTER_LABELS[activeTimeFilter].toLowerCase()} events
              {sortedOdds.length > 0 ? " — try another time filter" : " found"}.
            </p>
          </div>
        )}

        {!oddsLoading && filteredOdds.length > 0 && grouped && (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([league, events]) => (
              <section key={league}>
                <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  {leagueDisplayName(league)}
                </h2>
                <div className="space-y-3">
                  {events.map((e) => (
                    <Link key={e.event.id} href={`/events/${e.event.id}`} className="block">
                      <EventCard
                        event={e}
                        activeMarket={market}
                        valueBets={valueBetsByEvent.get(e.event.id)}
                        arbBets={arbBetsByEvent.get(e.event.id)}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!oddsLoading && filteredOdds.length > 0 && !grouped && (
          <div className="space-y-3">
            {filteredOdds.map((e) => (
              <Link key={e.event.id} href={`/events/${e.event.id}`} className="block">
                <EventCard
                  event={e}
                  activeMarket={market}
                  valueBets={valueBetsByEvent.get(e.event.id)}
                  arbBets={arbBetsByEvent.get(e.event.id)}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
