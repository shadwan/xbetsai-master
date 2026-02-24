"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/src/components/Header";
import { LiveBadge } from "@/src/components/LiveBadge";
import { EVBadge } from "@/src/components/EVBadge";
import { ArbBadge } from "@/src/components/ArbBadge";
import { OddsCell } from "@/src/components/OddsCell";
import { StakeCalculator } from "@/src/components/StakeCalculator";
import { PropsSection } from "@/src/components/PropsSection";
import { LineChart } from "@/src/components/LineChart";
import { Skeleton } from "@/src/components/Skeleton";
import { useEventOdds } from "@/src/lib/hooks/use-odds";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import { SPORTS, BOOKMAKERS } from "@/src/lib/odds-api/constants";
import {
  findBestOdds,
  decimalToAmerican,
  impliedProbability,
  getTeamNames,
  getStartTime,
  getLeagueSlug,
} from "@/src/lib/utils/odds";
import type { WsMarket } from "@/src/lib/odds-api/types";

const MARKET_NAMES = ["ML", "Spread", "Totals"] as const;

function outcomeKeysForMarket(market: string): { key: string; label: string }[] {
  switch (market) {
    case "ML":
      return [
        { key: "home", label: "Home" },
        { key: "away", label: "Away" },
      ];
    case "Spread":
      return [
        { key: "home", label: "Home" },
        { key: "away", label: "Away" },
      ];
    case "Totals":
      return [
        { key: "over", label: "Over" },
        { key: "under", label: "Under" },
      ];
    default:
      return [];
  }
}

function formatStartTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const live = eventOdds
    ? eventOdds.event.status === "live" ||
      (getStartTime(eventOdds.event) ? now >= new Date(getStartTime(eventOdds.event)).getTime() : false)
    : false;

  const leagueDisplay = eventOdds
    ? SPORTS.find((s) => s.leagueSlug === getLeagueSlug(eventOdds.event))?.displayName ??
      getLeagueSlug(eventOdds.event)
    : "";

  const teamNames = eventOdds ? getTeamNames(eventOdds.event) : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to Dashboard
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 rounded" />
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        )}

        {!isLoading && !eventOdds && (
          <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <p className="text-text-secondary">Event not found.</p>
          </div>
        )}

        {eventOdds && (
          <>
            {/* Event header */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-text-primary">
                  {teamNames!.home} vs {teamNames!.away}
                </h1>
                {live && <LiveBadge />}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>{leagueDisplay}</span>
                <span>·</span>
                <span>{formatStartTime(getStartTime(eventOdds.event))}</span>
              </div>
            </div>

            {/* Full odds — all 3 markets */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Odds Comparison</h2>
              {MARKET_NAMES.map((marketName) => {
                const bestOdds = findBestOdds(marketName, eventOdds.bookmakers);
                const rows = outcomeKeysForMarket(marketName);

                // Check for draw in ML
                const hasDrawInML =
                  marketName === "ML" &&
                  Object.values(eventOdds.bookmakers).some((bk) => {
                    const m = bk.markets.find((mk: WsMarket) => mk.name === "ML");
                    return m?.odds[0]?.draw != null;
                  });
                const allRows = hasDrawInML
                  ? [...rows, { key: "draw", label: "Draw" }]
                  : rows;

                return (
                  <div
                    key={marketName}
                    className="rounded-lg border border-border bg-surface overflow-hidden"
                  >
                    <div className="border-b border-border px-4 py-2">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {marketName}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-[500px]">
                        {/* Column headers */}
                        <div
                          className="grid gap-1 px-4 py-2"
                          style={{
                            gridTemplateColumns: `120px repeat(${BOOKMAKERS.length}, 1fr)`,
                          }}
                        >
                          <div />
                          {BOOKMAKERS.map((bk) => (
                            <div
                              key={bk}
                              className="text-center text-xs text-text-tertiary font-medium truncate"
                            >
                              {bk}
                            </div>
                          ))}
                        </div>

                        {/* Outcome rows */}
                        {allRows.map((row) => (
                          <div
                            key={row.key}
                            className="grid gap-1 px-4 py-0.5"
                            style={{
                              gridTemplateColumns: `120px repeat(${BOOKMAKERS.length}, 1fr)`,
                            }}
                          >
                            <div className="flex items-center text-sm text-text-secondary">
                              {row.label}
                            </div>
                            {BOOKMAKERS.map((bk) => {
                              const bkData = eventOdds.bookmakers[bk];
                              const market = bkData?.markets.find(
                                (m: WsMarket) => m.name === marketName,
                              );
                              const outcome = market?.odds[0];
                              const oddsVal =
                                outcome?.[row.key as keyof typeof outcome];
                              const decimal =
                                oddsVal != null
                                  ? parseFloat(String(oddsVal))
                                  : null;
                              const isBest =
                                bestOdds[row.key]?.bookmaker === bk &&
                                decimal != null;

                              return (
                                <OddsCell
                                  key={bk}
                                  decimalOdds={
                                    isNaN(decimal as number) ? null : decimal
                                  }
                                  isBest={isBest}
                                  marketType={marketName}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* +EV Details */}
            {eventValueBets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-text-primary">
                  +EV Opportunities
                </h2>
                <div className="space-y-3">
                  {eventValueBets.map((vb, i) => {
                    const american = decimalToAmerican(vb.odds);
                    const fairAmerican = decimalToAmerican(vb.fairOdds);
                    const fairProb = impliedProbability(vb.fairOdds);
                    const kellyQuarter =
                      ((fairProb * vb.odds - 1) / (vb.odds - 1) / 4) * 100;

                    // Find bookmaker URL
                    const bkUrl = eventOdds.bookmakers[vb.bookmaker]?.url;

                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {vb.market} — {vb.outcome}
                            </span>
                            <EVBadge valuePercentage={vb.valuePercentage} />
                          </div>
                          {bkUrl && (
                            <a
                              href={bkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-neon-cyan hover:underline"
                            >
                              {vb.bookmaker} →
                            </a>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-text-tertiary">Book odds: </span>
                            <span className="font-mono text-text-primary">
                              {american > 0 ? `+${american}` : american}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-tertiary">Fair odds: </span>
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
                    );
                  })}
                </div>
              </section>
            )}

            {/* Surebet section */}
            {eventArbBets.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-text-primary">
                  Surebet Opportunities
                </h2>
                {eventArbBets.map((arb, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-neon-yellow/20 bg-neon-yellow/5 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {arb.market}
                      </span>
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
                ))}
              </section>
            )}

            {/* Line movement chart */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-text-primary">
                Line Movement
              </h2>
              <LineChart eventId={eventId} />
            </section>

            {/* Player props */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-text-primary">
                Player Props
              </h2>
              <PropsSection eventId={eventId} />
            </section>
          </>
        )}
      </main>
    </>
  );
}
