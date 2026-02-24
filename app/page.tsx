"use client";

import { useMemo } from "react";
import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { EventListing } from "@/src/components/EventListing";
import { useOdds } from "@/src/lib/hooks/use-odds";
import { useEvents } from "@/src/lib/hooks/use-events";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import type { Event } from "odds-api-io";

export default function HomePage() {
  const { data: oddsData, isLoading: oddsLoading } = useOdds();
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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <SportTabs eventCounts={eventCounts} />
        <EventListing
          odds={oddsData}
          isLoading={oddsLoading}
          valueBets={valueBets}
          arbBets={arbBets}
        />
      </main>
    </>
  );
}
