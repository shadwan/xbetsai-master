"use client";

import { EventCard } from "@/src/components/EventCard";
import {
  LANDING_EVENTS,
  LANDING_VALUE_BETS,
  LANDING_ARB_BETS,
} from "./landing-fixtures";

export function LandingShowcase() {
  return (
    <section className="relative py-20 sm:py-28">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-neon-gold/[0.02] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-[800] tracking-tight text-text-primary sm:text-4xl">
            See Your Edge in Every Game
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Live odds, +EV alerts, and arbitrage opportunities — all at a glance.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_EVENTS.map((event) => (
            <EventCard
              key={String(event.event.id)}
              event={event}
              valueBets={LANDING_VALUE_BETS}
              arbBets={LANDING_ARB_BETS}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
