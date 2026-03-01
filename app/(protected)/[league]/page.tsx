"use client";

import { useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { EventListing } from "@/src/components/EventListing";
import { LeagueLogo } from "@/src/components/LeagueLogo";
import { useOdds } from "@/src/lib/hooks/use-odds";
import { useEvents } from "@/src/lib/hooks/use-events";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import { SPORTS, isInSeason } from "@/src/lib/odds-api/constants";
import type { SportConfig } from "@/src/lib/odds-api/constants";
import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";
import type { Event } from "odds-api-io";

function findSport(slug: string): SportConfig | undefined {
  return SPORTS.find((s) => s.displayName.toLowerCase() === slug);
}

export default function LeaguePage() {
  const { league } = useParams<{ league: string }>();
  const sport = findSport(league);

  if (!sport) {
    notFound();
  }

  return <LeagueContent sport={sport} league={league} />;
}

function LeagueContent({ sport, league }: { sport: SportConfig; league: string }) {
  const { data: oddsData, isLoading: oddsLoading } = useOdds(sport.leagueSlug);
  const { data: eventsData, isLoading: eventsLoading } = useEvents(sport.leagueSlug);
  const { data: valueBets } = useValueBets();
  const { data: arbBets } = useArbBets();

  // Merge all events with odds data — events without odds get empty bookmakers
  const mergedOdds = useMemo(() => {
    const events: Event[] = Array.isArray(eventsData) ? eventsData : [];
    if (events.length === 0) return oddsData ?? [];

    // Index odds by event ID for fast lookup
    const oddsMap = new Map<string, ConsolidatedOddsEvent>();
    if (oddsData) {
      for (const o of oddsData) {
        oddsMap.set(String(o.event.id), o);
      }
    }

    const result: ConsolidatedOddsEvent[] = [];
    for (const event of events) {
      const status = event.status as string | undefined;
      // Skip settled/finished events
      if (status === "finished" || status === "settled") continue;

      const existing = oddsMap.get(String(event.id));
      if (existing) {
        result.push(existing);
      } else {
        result.push({ event, bookmakers: {}, lastUpdated: 0 });
      }
    }

    return result;
  }, [eventsData, oddsData]);

  const isLoading = oddsLoading && eventsLoading;
  const offSeason = !isInSeason(sport.season);
  const eventCount = mergedOdds.length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <SportTabs activeLeague={league} />

        {/* League header */}
        <div className="flex items-center gap-3">
          <LeagueLogo league={sport.leagueSlug} size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                {sport.displayName}
              </h1>
              {offSeason && (
                <span className="rounded-full bg-text-tertiary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  Off-season
                </span>
              )}
            </div>
            <p className="text-sm text-text-tertiary">
              {sport.season} season
              {!isLoading && (
                <span> &middot; {eventCount} {eventCount === 1 ? "event" : "events"}</span>
              )}
            </p>
          </div>
        </div>

        <EventListing
          odds={mergedOdds}
          isLoading={isLoading}
          valueBets={valueBets}
          arbBets={arbBets}
          singleLeague
        />
      </main>
    </>
  );
}
