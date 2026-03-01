"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/src/components/Header";
import { EventHero } from "@/src/components/event-detail/EventHero";
import { MatchupInsights } from "@/src/components/event-detail/MatchupInsights";
import { OddsComparison } from "@/src/components/event-detail/OddsComparison";
import { EVBadge } from "@/src/components/EVBadge";
import { ArbBadge } from "@/src/components/ArbBadge";
import { StakeCalculator } from "@/src/components/StakeCalculator";
import { PlayerPropsSection } from "@/src/components/event-detail/PlayerPropsSection";
import { LineChart } from "@/src/components/LineChart";
import { Skeleton } from "@/src/components/Skeleton";
import { useEventOdds } from "@/src/lib/hooks/use-odds";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import {
  decimalToAmerican,
  impliedProbability,
  getLeagueSlug,
  getTeamNames,
} from "@/src/lib/utils/odds";
import { getTeamAbbreviation } from "@/src/lib/utils/team-abbrevs";
import type { ConsolidatedOddsEvent, ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Users } from "lucide-react";

const TABS = [
  { id: "odds", label: "Odds & Markets", icon: BarChart3 },
  { id: "lines", label: "Line Movement", icon: TrendingUp },
  { id: "props", label: "Player Props", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

function EventDetailTabs({
  eventOdds,
  eventId,
  eventValueBets,
  eventArbBets,
}: {
  eventOdds: ConsolidatedOddsEvent;
  eventId: string;
  eventValueBets: ValueBet[];
  eventArbBets: ArbitrageBet[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("odds");

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200",
                isActive
                  ? "bg-white/10 text-text-primary shadow-sm ring-1 ring-white/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
              )}
            >
              <Icon size={18} className={isActive ? "text-neon-cyan" : ""} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "odds" && (
        <div className="space-y-6">
          {/* Unified odds comparison table */}
          {(() => {
            const { home, away } = getTeamNames(eventOdds.event);
            const leagueSlug = getLeagueSlug(eventOdds.event);
            return (
              <OddsComparison
                eventOdds={eventOdds}
                homeTeam={home}
                awayTeam={away}
                homeAbbrev={getTeamAbbreviation(leagueSlug, home) ?? undefined}
                awayAbbrev={getTeamAbbreviation(leagueSlug, away) ?? undefined}
                league={leagueSlug}
              />
            );
          })()}

          {/* +EV Opportunities */}
          {eventValueBets.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-text-primary">+EV Opportunities</h2>
              <div className="space-y-3">
                {eventValueBets.map((vb, i) => {
                  const american = decimalToAmerican(vb.odds);
                  const fairAmerican = decimalToAmerican(vb.fairOdds);
                  const fairProb = impliedProbability(vb.fairOdds);
                  const kellyQuarter =
                    ((fairProb * vb.odds - 1) / (vb.odds - 1) / 4) * 100;
                  const bkUrl = eventOdds.bookmakers[vb.bookmaker]?.url;

                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-text-primary">
                            {vb.market} — {vb.outcome}
                          </span>
                          <EVBadge valuePercentage={vb.valuePercentage} />
                        </div>
                        {bkUrl && (
                          <a
                            href={bkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-neon-cyan hover:underline"
                          >
                            {vb.bookmaker} →
                          </a>
                        )}
                      </div>
                      <div className="flex gap-6 text-base">
                        <div>
                          <span className="text-text-secondary">Book odds: </span>
                          <span className="font-mono text-text-primary">
                            {american > 0 ? `+${american}` : american}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Fair odds: </span>
                          <span className="font-mono text-text-primary">
                            {fairAmerican > 0 ? `+${fairAmerican}` : fairAmerican}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">¼ Kelly: </span>
                          <span className="font-mono text-neon-green">
                            {kellyQuarter.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Surebet Opportunities */}
          {eventArbBets.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-text-primary">Surebet Opportunities</h2>
              {eventArbBets.map((arb, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neon-yellow/20 bg-neon-yellow/5 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-text-primary">{arb.market}</span>
                    <ArbBadge profitPercentage={arb.profitPercentage} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-base">
                    {arb.legs?.map((leg, j) => {
                      const am = decimalToAmerican(leg.odds);
                      return (
                        <span key={j} className="text-text-secondary">
                          {leg.bookmaker}:{" "}
                          <span className="font-mono text-text-primary">
                            {leg.outcome} {am > 0 ? `+${am}` : am}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  <StakeCalculator arbBet={arb} />
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {activeTab === "lines" && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Line Movement</h2>
          <LineChart eventId={eventId} />
        </section>
      )}

      {activeTab === "props" && (
        <PlayerPropsSection
          eventOdds={eventOdds}
          league={getLeagueSlug(eventOdds.event)}
          valueBets={eventValueBets}
          homeTeam={getTeamNames(eventOdds.event).home}
          awayTeam={getTeamNames(eventOdds.event).away}
        />
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: eventOdds, isLoading } = useEventOdds(eventId);
  const { data: valueBets } = useValueBets();
  const { data: arbBets } = useArbBets();

  const eventValueBets = useMemo(
    () => (valueBets ?? []).filter((vb) => vb.eventId === eventId),
    [valueBets, eventId],
  );

  const eventArbBets = useMemo(
    () => (arbBets ?? []).filter((ab) => ab.eventId === eventId),
    [arbBets, eventId],
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 rounded" />
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && !eventOdds && (
          <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <p className="text-text-secondary">Event not found.</p>
          </div>
        )}

        {eventOdds && (
          <>
            {/* Event Hero Header */}
            <EventHero event={eventOdds} />

            {/* Standings + Predictions + Summary cards */}
            <MatchupInsights
              event={eventOdds}
              valueBets={eventValueBets}
              arbBets={eventArbBets}
            />

            {/* Tabbed content */}
            <EventDetailTabs
              eventOdds={eventOdds}
              eventId={eventId}
              eventValueBets={eventValueBets}
              eventArbBets={eventArbBets}
            />
          </>
        )}
      </main>
    </>
  );
}
