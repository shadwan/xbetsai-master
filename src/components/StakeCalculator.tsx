"use client";

import { useState, useMemo } from "react";
import type { ArbitrageBet } from "@/src/lib/odds-api/types";
import { decimalToAmerican, impliedProbability } from "@/src/lib/utils/odds";

interface StakeCalculatorProps {
  arbBet: ArbitrageBet;
}

interface LegDisplay {
  outcome: string;
  bookmaker: string;
  decimalOdds: number;
  americanOdds: number;
  stake: number;
  payout: number;
}

export function StakeCalculator({ arbBet }: StakeCalculatorProps) {
  const [totalStake, setTotalStake] = useState(100);

  const { legs, profit, roi } = useMemo(() => {
    // ArbitrageBet has `legs` array with outcome, bookmaker, odds (decimal)
    const betLegs = arbBet.legs ?? [];
    const sumImplied = betLegs.reduce(
      (sum: number, leg: { odds: number }) => sum + impliedProbability(leg.odds),
      0,
    );

    const calculated: LegDisplay[] = betLegs.map(
      (leg: { outcome: string; bookmaker: string; odds: number }) => {
        const stake = (totalStake * (1 / leg.odds)) / sumImplied;
        const payout = stake * leg.odds;
        return {
          outcome: leg.outcome,
          bookmaker: leg.bookmaker,
          decimalOdds: leg.odds,
          americanOdds: decimalToAmerican(leg.odds),
          stake,
          payout,
        };
      },
    );

    const profitAmount = totalStake * (1 / sumImplied - 1);
    const roiPercent = (1 / sumImplied - 1) * 100;

    return { legs: calculated, profit: profitAmount, roi: roiPercent };
  }, [arbBet, totalStake]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Stake Calculator</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary" htmlFor="total-stake">
            Total Stake $
          </label>
          <input
            id="total-stake"
            type="number"
            min={1}
            value={totalStake}
            onChange={(e) => setTotalStake(Math.max(1, Number(e.target.value)))}
            className="w-24 rounded border border-border bg-elevated px-2 py-1 text-right font-mono text-sm text-text-primary focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-tertiary">
              <th className="px-3 py-2 text-left font-medium">Outcome</th>
              <th className="px-3 py-2 text-left font-medium">Bookmaker</th>
              <th className="px-3 py-2 text-right font-medium">Odds</th>
              <th className="px-3 py-2 text-right font-medium">Stake</th>
              <th className="px-3 py-2 text-right font-medium">Payout</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-text-primary">{leg.outcome}</td>
                <td className="px-3 py-2 text-text-secondary">{leg.bookmaker}</td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">
                  {leg.americanOdds > 0 ? `+${leg.americanOdds}` : leg.americanOdds}
                </td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">
                  ${leg.stake.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">
                  ${leg.payout.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-elevated px-4 py-3">
        <span className="text-sm text-text-secondary">Guaranteed Profit</span>
        <span className="font-mono text-lg font-bold text-neon-green">
          +${profit.toFixed(2)} ({roi.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
