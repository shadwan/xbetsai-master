"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/src/components/Header";
import { SportTabs } from "@/src/components/SportTabs";
import { EVBadge } from "@/src/components/EVBadge";
import { ArbBadge } from "@/src/components/ArbBadge";
import { StakeCalculator } from "@/src/components/StakeCalculator";
import { OddsGridSkeleton } from "@/src/components/Skeleton";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import { useEvents } from "@/src/lib/hooks/use-events";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { decimalToAmerican, impliedProbability, getTeamNames, getLeagueSlug } from "@/src/lib/utils/odds";
import type { Event } from "odds-api-io";

type FilterTab = "all" | "value" | "arb";

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<Header />}>
      <OpportunitiesContent />
    </Suspense>
  );
}

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport = searchParams.get("sport") ?? "all";
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const { data: valueBets, isLoading: vbLoading } = useValueBets();
  const { data: arbBets, isLoading: arbLoading, dataUpdatedAt: arbUpdatedAt } = useArbBets();
  const { data: eventsData } = useEvents();

  // Tick every 10s so freshness display updates without calling Date.now() in render
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  function setSport(s: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "all") {
      params.delete("sport");
    } else {
      params.set("sport", s);
    }
    router.replace(`/opportunities?${params.toString()}`);
  }

  // Build event map for lookups
  const eventMap = useMemo(() => {
    const map = new Map<string, Event>();
    if (!eventsData) return map;
    if (Array.isArray(eventsData)) {
      for (const e of eventsData) {
        map.set(e.id, e);
      }
    } else {
      for (const events of Object.values(eventsData as Record<string, Event[]>)) {
        for (const e of events) {
          map.set(e.id, e);
        }
      }
    }
    return map;
  }, [eventsData]);

  // Filter + sort value bets
  const filteredValueBets = useMemo(() => {
    if (!valueBets) return [];
    let filtered = valueBets;
    if (sport !== "all") {
      filtered = filtered.filter((vb) => {
        const ev = eventMap.get(vb.eventId);
        return ev ? getLeagueSlug(ev) === sport : false;
      });
    }
    return [...filtered].sort((a, b) => b.valuePercentage - a.valuePercentage);
  }, [valueBets, sport, eventMap]);

  // Filter + sort arb bets
  const filteredArbBets = useMemo(() => {
    if (!arbBets) return [];
    let filtered = arbBets;
    if (sport !== "all") {
      filtered = filtered.filter((ab) => {
        const ev = eventMap.get(ab.eventId);
        return ev ? getLeagueSlug(ev) === sport : false;
      });
    }
    return [...filtered].sort((a, b) => b.profitPercentage - a.profitPercentage);
  }, [arbBets, sport, eventMap]);

  const isLoading = vbLoading || arbLoading;

  // Freshness check for arb bets
  const arbStale = arbUpdatedAt > 0 && now - arbUpdatedAt > 2 * 60 * 1000;

  function relativeTime(timestamp: number): string {
    if (!timestamp) return "";
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "value", label: "+EV Bets" },
    { key: "arb", label: "Surebets" },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-text-primary">Opportunities</h1>

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
            <SportTabs activeSport={sport} onSportChange={setSport} />
          </div>

          {/* Filter tabs */}
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  filterTab === tab.key
                    ? "bg-elevated text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <OddsGridSkeleton rows={4} />}

        {/* Value Bets */}
        {!isLoading && (filterTab === "all" || filterTab === "value") && (
          <section className="space-y-3">
            {(filterTab === "all") && (
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                +EV Bets ({filteredValueBets.length})
              </h2>
            )}
            {filteredValueBets.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
                <p className="text-text-secondary text-sm">No value bets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredValueBets.map((vb, i) => {
                  const ev = eventMap.get(vb.eventId);
                  const { home, away } = ev
                    ? getTeamNames(ev)
                    : { home: "TBD", away: "TBD" };
                  const eventName = ev ? `${home} vs ${away}` : vb.eventId;
                  const american = decimalToAmerican(vb.odds);
                  const fairAmerican = decimalToAmerican(vb.fairOdds);
                  const fairProb = impliedProbability(vb.fairOdds);
                  const kellyQuarter =
                    ((fairProb * vb.odds - 1) / (vb.odds - 1) / 4) * 100;
                  const leagueSlug = ev ? getLeagueSlug(ev) : "";
                  const league = leagueSlug
                    ? SPORTS.find((s) => s.leagueSlug === leagueSlug)?.displayName ?? leagueSlug
                    : "";

                  return (
                    <Link
                      key={`${vb.eventId}-${vb.market}-${vb.outcome}-${i}`}
                      href={`/events/${vb.eventId}`}
                      className="block"
                    >
                      <div className="rounded-lg border border-neon-green/20 bg-surface hover:bg-hover transition-colors p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {eventName}
                            </span>
                            {league && (
                              <span className="text-xs text-text-tertiary">{league}</span>
                            )}
                          </div>
                          <EVBadge valuePercentage={vb.valuePercentage} />
                        </div>
                        <div className="text-sm text-text-secondary">
                          {vb.market} — {vb.outcome}
                          {" · "}
                          <span className="text-text-tertiary">{vb.bookmaker}</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-text-tertiary">Book: </span>
                            <span className="font-mono text-text-primary">
                              {american > 0 ? `+${american}` : american}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-tertiary">Fair: </span>
                            <span className="font-mono text-text-primary">
                              {fairAmerican > 0 ? `+${fairAmerican}` : fairAmerican}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-tertiary">¼ Kelly: </span>
                            <span className="font-mono text-neon-green">
                              {kellyQuarter.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Arb Bets */}
        {!isLoading && (filterTab === "all" || filterTab === "arb") && (
          <section className="space-y-3">
            {(filterTab === "all") && (
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  Surebets ({filteredArbBets.length})
                </h2>
                {arbUpdatedAt > 0 && (
                  <span className="text-xs text-text-tertiary">
                    Updated {relativeTime(arbUpdatedAt)}
                  </span>
                )}
              </div>
            )}
            {filteredArbBets.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
                <p className="text-text-secondary text-sm">
                  No arbitrage opportunities found.
                </p>
              </div>
            ) : (
              <div className={`space-y-3 ${arbStale ? "opacity-50" : ""}`}>
                {filteredArbBets.map((arb, i) => {
                  const ev = eventMap.get(arb.eventId);
                  const { home: arbHome, away: arbAway } = ev
                    ? getTeamNames(ev)
                    : { home: "TBD", away: "TBD" };
                  const eventName = ev ? `${arbHome} vs ${arbAway}` : arb.eventId;
                  const leagueSlug = ev ? getLeagueSlug(ev) : "";
                  const league = leagueSlug
                    ? SPORTS.find((s) => s.leagueSlug === leagueSlug)?.displayName ?? leagueSlug
                    : "";

                  return (
                    <div
                      key={`${arb.eventId}-${arb.market}-${i}`}
                      className="rounded-lg border border-neon-yellow/20 bg-surface p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/events/${arb.eventId}`}
                          className="flex items-center gap-2 min-w-0 hover:underline"
                        >
                          <span className="text-sm font-semibold text-text-primary truncate">
                            {eventName}
                          </span>
                          {league && (
                            <span className="text-xs text-text-tertiary">{league}</span>
                          )}
                        </Link>
                        <ArbBadge profitPercentage={arb.profitPercentage} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
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
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
