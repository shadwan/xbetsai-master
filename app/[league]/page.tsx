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
import { SPORTS } from "@/src/lib/odds-api/constants";
import type { SportConfig } from "@/src/lib/odds-api/constants";
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
  const { data: eventsData } = useEvents();
  const { data: valueBets } = useValueBets();
  const { data: arbBets } = useArbBets();

  const eventCounts = useMemo(() => {
    if (!eventsData || Array.isArray(eventsData)) return undefined;
    const counts: Record<string, number> = {};
    for (const [key, events] of Object.entries(eventsData as Record<string, Event[]>)) {
      counts[key] = events.length;
    }
    return counts;
  }, [eventsData]);

  const eventCount = eventCounts?.[sport.leagueSlug] ?? oddsData?.length ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <SportTabs activeLeague={league} eventCounts={eventCounts} />

        {/* League header */}
        <div className="flex items-center gap-3">
          <LeagueLogo league={sport.leagueSlug} size={36} />
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {sport.displayName}
            </h1>
            <p className="text-sm text-text-tertiary">
              {sport.season} season
              {!oddsLoading && (
                <span> &middot; {eventCount} {eventCount === 1 ? "event" : "events"}</span>
              )}
            </p>
          </div>
        </div>

        <EventListing
          odds={oddsData}
          isLoading={oddsLoading}
          valueBets={valueBets}
          arbBets={arbBets}
          singleLeague
        />
      </main>
    </>
  );
}
