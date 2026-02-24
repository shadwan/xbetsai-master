"use client";

import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { EventListing } from "@/src/components/EventListing";
import { LeagueLogo } from "@/src/components/LeagueLogo";
import { DEV_EVENTS, DEV_VALUE_BETS, DEV_ARB_BETS } from "@/src/lib/mock/dev-fixtures";

/**
 * Dev-only page with 3 mock NBA events (live, today, tomorrow).
 * Visit /dev to see static fixtures that don't change with live data.
 */
export default function DevLeaguePage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Not available in production.</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <SportTabs activeLeague="dev" />

        {/* League header */}
        <div className="flex items-center gap-3">
          <LeagueLogo league="usa-nba" size={36} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                DEV Fixtures
              </h1>
              <span className="rounded-full bg-neon-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neon-cyan ring-1 ring-neon-cyan/25">
                Mock Data
              </span>
            </div>
            <p className="text-sm text-text-tertiary">
              3 static NBA events &middot; 1 live &middot; 1 today &middot; 1 tomorrow
            </p>
          </div>
        </div>

        <EventListing
          odds={DEV_EVENTS}
          isLoading={false}
          valueBets={DEV_VALUE_BETS}
          arbBets={DEV_ARB_BETS}
          singleLeague
        />
      </main>
    </>
  );
}
