"use client";

import { BOOKMAKERS } from "@/src/lib/odds-api/constants";
import { decimalToAmerican } from "@/src/lib/utils/odds";
import type { ParsedPropMarket } from "@/src/lib/utils/props";

interface PropsTableProps {
  market: ParsedPropMarket;
}

function formatOdds(decimal: number): string {
  if (decimal <= 0) return "—";
  const am = decimalToAmerican(decimal);
  return am > 0 ? `+${am}` : `${am}`;
}

export function PropsTable({ market }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-surface px-4 py-2 text-left text-xs font-medium text-text-tertiary">
              Player
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-text-tertiary">
              Line
            </th>
            {BOOKMAKERS.map((bk) => (
              <th
                key={bk}
                colSpan={2}
                className="px-2 py-2 text-center text-xs font-medium text-text-tertiary"
              >
                {bk}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-surface" />
            <th />
            {BOOKMAKERS.map((bk) => (
              <th key={bk} colSpan={2} className="px-1 pb-1">
                <div className="flex gap-0.5 text-[10px] text-text-tertiary">
                  <span className="flex-1 text-center">O</span>
                  <span className="flex-1 text-center">U</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {market.lines.map((line) => (
            <tr
              key={line.playerName}
              className={`border-b border-border last:border-0 hover:bg-hover transition-colors ${
                line.lineDiscrepancy ? "bg-neon-yellow/5" : ""
              }`}
            >
              <td className="sticky left-0 z-10 bg-surface px-4 py-2 text-text-primary font-medium whitespace-nowrap">
                {line.playerName}
                {line.lineDiscrepancy && (
                  <span className="ml-1.5 text-[10px] text-neon-yellow" title="Line differs across books">
                    ⚠
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-center font-mono text-text-secondary">
                {line.line}
              </td>
              {BOOKMAKERS.map((bk) => {
                const odds = line.bookmakerOdds[bk];
                const isBestOver = line.bestOver?.bookmaker === bk;
                const isBestUnder = line.bestUnder?.bookmaker === bk;

                return (
                  <td key={bk} colSpan={2} className="px-1 py-2">
                    <div className="flex gap-0.5 font-mono text-xs">
                      <span
                        className={`flex-1 text-center rounded px-1 py-0.5 ${
                          isBestOver
                            ? "text-neon-cyan bg-neon-cyan/10"
                            : "text-text-primary"
                        }`}
                      >
                        {odds ? formatOdds(odds.over) : "—"}
                      </span>
                      <span
                        className={`flex-1 text-center rounded px-1 py-0.5 ${
                          isBestUnder
                            ? "text-neon-cyan bg-neon-cyan/10"
                            : "text-text-primary"
                        }`}
                      >
                        {odds ? formatOdds(odds.under) : "—"}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
