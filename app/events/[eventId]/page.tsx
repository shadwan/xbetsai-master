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
import { TeamLogo } from "@/src/components/TeamLogo";
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
import { BarChart3, Users, Zap } from "lucide-react";

const TABS = [
  { id: "odds", label: "Odds & Markets", icon: BarChart3 },
  { id: "opportunities", label: "Opportunities", icon: Zap },
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
  const [selectedSide, setSelectedSide] = useState<"home" | "away">("home");

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
              <>
                <OddsComparison
                  eventOdds={eventOdds}
                  homeTeam={home}
                  awayTeam={away}
                  homeAbbrev={getTeamAbbreviation(leagueSlug, home) ?? undefined}
                  awayAbbrev={getTeamAbbreviation(leagueSlug, away) ?? undefined}
                  league={leagueSlug}
                />

                {/* Line Movement */}
                <section className="space-y-3">
                  <h2 className="text-xl font-semibold text-text-primary">Line Movement</h2>
                  <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedSide("away")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2 transition-colors",
                          selectedSide === "away"
                            ? "bg-neon-cyan/10 ring-1 ring-neon-cyan/30"
                            : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06]",
                        )}
                      >
                        {leagueSlug && away && (
                          <TeamLogo league={leagueSlug} teamName={away} size={22} />
                        )}
                        <span
                          className={cn(
                            "text-base font-semibold",
                            selectedSide === "away" ? "text-neon-cyan" : "text-text-secondary",
                          )}
                        >
                          {away}
                        </span>
                      </button>

                      <span className="text-base font-bold text-text-tertiary">vs</span>

                      <button
                        onClick={() => setSelectedSide("home")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3.5 py-2 transition-colors",
                          selectedSide === "home"
                            ? "bg-neon-cyan/10 ring-1 ring-neon-cyan/30"
                            : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06]",
                        )}
                      >
                        {leagueSlug && home && (
                          <TeamLogo league={leagueSlug} teamName={home} size={22} />
                        )}
                        <span
                          className={cn(
                            "text-base font-semibold",
                            selectedSide === "home" ? "text-neon-cyan" : "text-text-secondary",
                          )}
                        >
                          {home}
                        </span>
                      </button>
                  </div>
                  <LineChart
                    eventId={eventId}
                    homeTeam={home}
                    awayTeam={away}
                    league={leagueSlug}
                    selectedSide={selectedSide}
                  />
                </section>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === "opportunities" && (
        <div className="space-y-6">
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

          {/* Empty state */}
          {eventValueBets.length === 0 && eventArbBets.length === 0 && (
            <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-16 text-center">
              <Zap size={32} className="mx-auto mb-3 text-text-tertiary" />
              <p className="text-base text-text-secondary">
                No +EV or surebet opportunities found for this event right now.
              </p>
              <p className="mt-1 text-base text-text-tertiary">
                Opportunities are detected automatically — check back closer to game time.
              </p>
            </div>
          )}
        </div>
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
