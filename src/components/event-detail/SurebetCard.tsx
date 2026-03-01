"use client";

import { useState, useMemo, useEffect } from "react";
import { ArbBadge } from "@/src/components/ArbBadge";
import {
  decimalToAmerican,
  impliedProbability,
  formatLine,
  getTeamNames,
} from "@/src/lib/utils/odds";
import { abbreviateBookmaker } from "@/src/lib/utils/props";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, Clock, ExternalLink } from "lucide-react";
import type { ArbitrageBet, ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";

interface SurebetCardProps {
  arb: ArbitrageBet;
  eventOdds: ConsolidatedOddsEvent;
  dataUpdatedAt: number; // react-query dataUpdatedAt (epoch ms)
}

const PRESET_STAKES = [50, 100, 250, 500];

function timeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SurebetCard({ arb, eventOdds, dataUpdatedAt }: SurebetCardProps) {
  const [totalStake, setTotalStake] = useState(100);
  const [showExplainer, setShowExplainer] = useState(false);

  // Live "Updated X ago" from react-query's dataUpdatedAt
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, now - dataUpdatedAt);
  const updatedAgo = dataUpdatedAt > 0 ? timeAgo(elapsed) : null;

  // Map "home"/"away" outcomes to actual team names
  const teamNames = useMemo(() => getTeamNames(eventOdds.event), [eventOdds.event]);
  const outcomeLabel = (outcome: string): string => {
    const lower = outcome.toLowerCase();
    if (lower === "home") return teamNames.home;
    if (lower === "away") return teamNames.away;
    return outcome;
  };

  const { legs, profit, roi } = useMemo(() => {
    const betLegs = arb.legs ?? [];
    // Use profitPercentage from the API to compute stakes (it's the source of truth)
    // profit% = (1/sumImplied - 1)*100, so sumImplied = 1 / (1 + profit%/100)
    const apiSumImplied = 1 / (1 + arb.profitPercentage / 100);

    const calculated = betLegs.map(
      (leg: { outcome: string; bookmaker: string; odds: number; href?: string }) => {
        const stake = (totalStake * (1 / leg.odds)) / apiSumImplied;
        const payout = stake * leg.odds;
        const americanOdds = decimalToAmerican(leg.odds);
        const bkData = eventOdds.bookmakers[leg.bookmaker];
        const bkUrl = leg.href || bkData?.url;
        return {
          outcome: leg.outcome,
          bookmaker: leg.bookmaker,
          decimalOdds: leg.odds,
          americanOdds,
          stake,
          payout,
          bkUrl: bkUrl as string | undefined,
        };
      },
    );

    const profitAmount = totalStake * (arb.profitPercentage / 100);
    const roiPercent = arb.profitPercentage;

    return { legs: calculated, profit: profitAmount, roi: roiPercent };
  }, [arb, eventOdds, totalStake]);

  const marketDisplay = [
    arb.market,
    formatLine(arb.market, arb.marketLine as number | undefined),
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="rounded-xl border border-neon-yellow/20 bg-neon-yellow/[0.03] overflow-hidden">
      {/* A. Header */}
      <div className="border-b border-neon-yellow/10 px-5 py-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ArbBadge profitPercentage={arb.profitPercentage} />
          <span className="text-base font-semibold text-text-primary">
            {marketDisplay}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold text-neon-green">
            +${arb.profitPercentage.toFixed(2)} guaranteed on $100
          </p>
          {updatedAgo && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1",
              elapsed < 30_000
                ? "bg-neon-green/10 text-neon-green ring-neon-green/20"
                : elapsed < 120_000
                  ? "bg-neon-yellow/10 text-neon-yellow ring-neon-yellow/20"
                  : "bg-red-500/10 text-red-400 ring-red-500/20",
            )}>
              <Clock size={14} />
              Updated {updatedAgo}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* B. Step-by-step instructions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            How to place this bet
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {legs.map((leg, i) => {
              const american = leg.americanOdds;
              const americanStr = american > 0 ? `+${american}` : `${american}`;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-cyan/15 text-xs font-bold text-neon-cyan">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      Step {i + 1}
                    </span>
                  </div>
                  <div className="space-y-1 pl-8">
                    <p className="text-base text-text-primary">
                      Bet{" "}
                      <span className="font-mono font-semibold text-neon-green">
                        ${leg.stake.toFixed(2)}
                      </span>{" "}
                      on{" "}
                      <span className="font-semibold">{outcomeLabel(leg.outcome)}</span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      at{" "}
                      <span className="font-mono text-text-primary">
                        {americanStr}
                      </span>{" "}
                      on {leg.bookmaker}
                    </p>
                  </div>
                  {leg.bkUrl && (
                    <a
                      href={leg.bkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-8 inline-flex items-center gap-1.5 rounded-lg bg-neon-cyan/10 px-3 py-1.5 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20"
                    >
                      Open {abbreviateBookmaker(leg.bookmaker)}
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Interactive stake input */}
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={`surebet-stake-${arb.market}`}
              className="text-sm font-medium text-text-secondary"
            >
              Total Stake
            </label>
            <div className="flex items-center gap-1">
              <span className="text-base font-medium text-text-primary">$</span>
              <input
                id={`surebet-stake-${arb.market}`}
                type="number"
                min={1}
                value={totalStake}
                onChange={(e) => setTotalStake(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-right font-mono text-base text-text-primary focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/40"
              />
            </div>
            <div className="flex gap-1.5">
              {PRESET_STAKES.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTotalStake(amount)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-sm font-medium transition-colors",
                    totalStake === amount
                      ? "bg-neon-cyan/15 text-neon-cyan ring-1 ring-neon-cyan/30"
                      : "bg-white/[0.05] text-text-secondary hover:text-text-primary hover:bg-white/[0.08]",
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-neon-green/[0.08] px-4 py-3 ring-1 ring-neon-green/20">
            <span className="text-sm font-medium text-text-secondary">
              Guaranteed Profit
            </span>
            <span className={cn(
              "font-mono text-lg font-bold",
              profit >= 0 ? "text-neon-green" : "text-red-400",
            )}>
              {profit >= 0 ? "+" : "-"}${Math.abs(profit).toFixed(2)} ({profit >= 0 ? "+" : ""}{roi.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* D. Timing warning */}
        <div className="flex items-start gap-2.5 rounded-lg bg-neon-yellow/[0.06] px-4 py-3 ring-1 ring-neon-yellow/15">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-neon-yellow" />
          <p className="text-sm text-neon-yellow/80">
            Place all bets quickly — odds can shift at any moment and eliminate the
            arbitrage window.
          </p>
        </div>

        {/* E. Collapsible explainer */}
        <button
          onClick={() => setShowExplainer((prev) => !prev)}
          className="flex w-full items-center gap-2 text-sm font-medium text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform duration-200",
              showExplainer && "rotate-180",
            )}
          />
          How does this work?
        </button>
        {showExplainer && (
          <div className="rounded-lg bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-text-secondary">
            A surebet (arbitrage) exploits different odds across bookmakers. By
            splitting your stake proportionally across all outcomes, every possible
            result returns the same profit — guaranteed. The edge exists because
            bookmakers price events independently, and occasionally their combined
            odds create a mathematical advantage for bettors.
          </div>
        )}
      </div>
    </div>
  );
}
