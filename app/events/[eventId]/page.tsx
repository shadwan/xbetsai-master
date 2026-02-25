"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/src/components/Header";
import { EventHero } from "@/src/components/event-detail/EventHero";
import { MatchupInsights } from "@/src/components/event-detail/MatchupInsights";
import { EVBadge } from "@/src/components/EVBadge";
import { ArbBadge } from "@/src/components/ArbBadge";
import { OddsCell } from "@/src/components/OddsCell";
import { StakeCalculator } from "@/src/components/StakeCalculator";
import { PlayerPropsSection } from "@/src/components/event-detail/PlayerPropsSection";
import { LineChart } from "@/src/components/LineChart";
import { Skeleton } from "@/src/components/Skeleton";
import { useEventOdds } from "@/src/lib/hooks/use-odds";
import { useValueBets } from "@/src/lib/hooks/use-value-bets";
import { useArbBets } from "@/src/lib/hooks/use-arb-bets";
import { BOOKMAKERS } from "@/src/lib/odds-api/constants";
import {
  findBestOdds,
  decimalToAmerican,
  impliedProbability,
  getLeagueSlug,
  getTeamNames,
} from "@/src/lib/utils/odds";
import { computeMarketConsensus, getBookmakerBreakdown } from "@/src/lib/utils/predictions";
import { PredictionBar } from "@/src/components/PredictionBar";
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

            {/* Market consensus predictions */}
            {(() => {
              const consensus = computeMarketConsensus(eventOdds);
              if (!consensus) return null;
              const breakdown = getBookmakerBreakdown(eventOdds);
              return (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Market Consensus
                  </h2>
                  <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
                    {/* Summary bar */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-text-primary">{consensus.away.name}</span>
                      <span className="text-xs text-text-tertiary">
                        {consensus.bookmakerCount} bookmakers
                      </span>
                      <span className="font-semibold text-text-primary">{consensus.home.name}</span>
                    </div>
                    <PredictionBar consensus={consensus} className="max-w-sm mx-auto" />

                    {/* Per-bookmaker breakdown */}
                    {breakdown.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="py-2 pr-4 text-left text-xs font-medium text-text-tertiary">
                                Bookmaker
                              </th>
                              <th className="py-2 px-2 text-center text-xs font-medium text-text-tertiary">
                                {consensus.away.name}
                              </th>
                              {consensus.draw && (
                                <th className="py-2 px-2 text-center text-xs font-medium text-text-tertiary">
                                  Draw
                                </th>
                              )}
                              <th className="py-2 pl-2 text-center text-xs font-medium text-text-tertiary">
                                {consensus.home.name}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {breakdown.map((bk) => (
                              <tr key={bk.bookmaker} className="border-b border-border/50">
                                <td className="py-1.5 pr-4 text-text-secondary">{bk.bookmaker}</td>
                                <td className="py-1.5 px-2 text-center font-mono text-text-primary">
                                  {(bk.away * 100).toFixed(1)}%
                                </td>
                                {consensus.draw && (
                                  <td className="py-1.5 px-2 text-center font-mono text-text-primary">
                                    {((bk.draw ?? 0) * 100).toFixed(1)}%
                                  </td>
                                )}
                                <td className="py-1.5 pl-2 text-center font-mono text-text-primary">
                                  {(bk.home * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                            {/* Consensus average row */}
                            <tr className="font-semibold">
                              <td className="py-1.5 pr-4 text-neon-cyan">Consensus</td>
                              <td className="py-1.5 px-2 text-center font-mono text-neon-cyan">
                                {(consensus.away.probability * 100).toFixed(1)}%
                              </td>
                              {consensus.draw && (
                                <td className="py-1.5 px-2 text-center font-mono text-neon-cyan">
                                  {(consensus.draw.probability * 100).toFixed(1)}%
                                </td>
                              )}
                              <td className="py-1.5 pl-2 text-center font-mono text-neon-cyan">
                                {(consensus.home.probability * 100).toFixed(1)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

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
            <PlayerPropsSection
              eventId={eventId}
              league={getLeagueSlug(eventOdds.event)}
              valueBets={eventValueBets}
              homeTeam={getTeamNames(eventOdds.event).home}
              awayTeam={getTeamNames(eventOdds.event).away}
            />
          </>
        )}
      </main>
    </>
  );
}
