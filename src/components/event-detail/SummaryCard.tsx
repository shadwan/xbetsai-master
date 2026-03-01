"use client";

import { useMemo } from "react";
import { Trophy, TrendingUp, BarChart3 } from "lucide-react";
import type { ConsolidatedOddsEvent } from "@/src/lib/odds-api/types";
import type { ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";
import { getTeamNames } from "@/src/lib/utils/odds";
import { computeMarketConsensus } from "@/src/lib/utils/predictions";
import { findBestOdds, decimalToAmerican } from "@/src/lib/utils/odds";
import { Skeleton } from "@/src/components/Skeleton";

interface SummaryCardProps {
  event: ConsolidatedOddsEvent;
  valueBets: ValueBet[];
  arbBets: ArbitrageBet[];
  isLoading?: boolean;
}

type SummaryType = "surebet" | "value" | "market";

interface Summary {
  type: SummaryType;
  title: string;
  body: string;
}

const ACCENT: Record<SummaryType, { iconBg: string; iconColor: string }> = {
  surebet: {
    iconBg: "bg-neon-gold/10",
    iconColor: "text-neon-gold",
  },
  value: {
    iconBg: "bg-neon-green/10",
    iconColor: "text-neon-green",
  },
  market: {
    iconBg: "bg-neon-gold/10",
    iconColor: "text-neon-gold",
  },
};

const ICON: Record<SummaryType, typeof Trophy> = {
  surebet: Trophy,
  value: TrendingUp,
  market: BarChart3,
};

function buildSummary(
  event: ConsolidatedOddsEvent,
  valueBets: ValueBet[],
  arbBets: ArbitrageBet[],
): Summary | null {
  const { home, away } = getTeamNames(event.event);

  // Map raw bet side to a readable label
  const sideLabel = (side: string): string => {
    switch (side.toLowerCase()) {
      case "home": return home;
      case "away": return away;
      case "over": return "Over";
      case "under": return "Under";
      case "draw": return "Draw";
      default: return side;
    }
  };

  // Priority 1: Surebet / arbitrage
  if (arbBets.length > 0) {
    const best = arbBets.reduce((a, b) =>
      (b.profitPercentage ?? 0) > (a.profitPercentage ?? 0) ? b : a,
    );
    const profit = (best.profitPercentage ?? 0).toFixed(2);
    const isTotals = best.market?.toLowerCase().includes("total");
    const legs = best.legs ?? [];

    let body: string;
    if (isTotals && best.marketLine != null) {
      const overLeg = legs.find((l) => l.outcome.toLowerCase() === "over");
      const underLeg = legs.find((l) => l.outcome.toLowerCase() === "under");
      body = `Surebet found on total score. Bet score will go over ${best.marketLine} at ${overLeg?.bookmaker ?? "?"} and under ${best.marketLine} at ${underLeg?.bookmaker ?? "?"} for a +${profit}% return.`;
    } else {
      const legParts = legs
        .slice(0, 2)
        .map((l) => `${sideLabel(l.outcome)} at ${l.bookmaker}`)
        .join(" and ");
      body = `Surebet found on ${best.market}. Back ${legParts} for a +${profit}% return.`;
    }

    return {
      type: "surebet",
      title: "Guaranteed Profit",
      body,
    };
  }

  // Priority 2: Value bet (+EV)
  if (valueBets.length > 0) {
    const best = valueBets.reduce((a, b) =>
      (b.valuePercentage ?? 0) > (a.valuePercentage ?? 0) ? b : a,
    );
    const american = decimalToAmerican(best.odds);
    const oddsStr = american > 0 ? `+${american}` : `${american}`;
    const ev = (best.valuePercentage ?? 0).toFixed(1);

    return {
      type: "value",
      title: "Value Bet Found",
      body: `Best edge: ${sideLabel(best.outcome)} ${best.market} ${oddsStr} at ${best.bookmaker} has ${ev}% expected value.`,
    };
  }

  // Priority 3: Market overview (always available if we have ML odds)
  const consensus = computeMarketConsensus(event);
  if (!consensus) return null;

  const homePct = Math.round(consensus.home.probability * 100);
  const awayPct = Math.round(consensus.away.probability * 100);
  const isFavHome = homePct >= awayPct;
  const favName = isFavHome ? home : away;
  const favPct = isFavHome ? homePct : awayPct;
  const favSide = isFavHome ? "home" : "away";

  // Best moneyline for the favorite
  const bestML = findBestOdds("ML", event.bookmakers);
  const favBest = bestML[favSide];
  let oddsStr = "";
  if (favBest) {
    const am = decimalToAmerican(favBest.odds);
    oddsStr = ` Best moneyline: ${am > 0 ? `+${am}` : am} at ${favBest.bookmaker}.`;
  }

  return {
    type: "market",
    title: "Market Overview",
    body: `${favName} is the ${favPct}% favorite.${oddsStr}`,
  };
}

export function SummaryCard({ event, valueBets, arbBets, isLoading }: SummaryCardProps) {
  const summary = useMemo(
    () => buildSummary(event, valueBets, arbBets),
    [event, valueBets, arbBets],
  );

  if (isLoading) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
        <div className="px-5 pt-4 pb-1">
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="space-y-2.5 px-5 pb-4 pt-2">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const accent = ACCENT[summary.type];
  const IconComp = ICON[summary.type];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
      <div className="px-5 pt-4 pb-1">
        <h3 className="text-base font-bold uppercase tracking-[0.15em] text-text-primary">
          Top Signal
        </h3>
      </div>

      <div className="px-5 pb-5 pt-2">
        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.iconBg}`}>
            <IconComp size={18} className={accent.iconColor} />
          </div>
          <span className="text-lg font-bold text-text-primary">
            {summary.title}
          </span>
        </div>

        {/* Body */}
        <p className="mt-3 text-base leading-[1.65] text-text-secondary">
          {summary.body}
        </p>
      </div>
    </div>
  );
}
