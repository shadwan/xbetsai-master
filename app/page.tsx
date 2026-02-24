"use client";

import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { EventListing } from "@/src/components/EventListing";
import { useOdds } from "@/src/lib/hooks/use-odds";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";

export default function HomePage() {
  const { data: oddsData, isLoading: oddsLoading } = useOdds();
  const { data: valueBets } = useValueBets();
  const { data: arbBets } = useArbBets();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <SportTabs />
        <EventListing
          odds={oddsData}
          isLoading={oddsLoading}
          valueBets={valueBets}
          arbBets={arbBets}
          todayOnly
        />
      </main>
    </>
  );
}
