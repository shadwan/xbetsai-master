"use client";

import type { ConsolidatedOddsEvent, ArbitrageBet, ValueBet } from "@/src/lib/odds-api/types";
import { BOOKMAKERS } from "@/src/lib/odds-api/constants";
import { findBestOdds, formatLine, getTeamNames, getStartTime } from "@/src/lib/utils/odds";
import { OddsCell } from "./OddsCell";
import { LiveBadge } from "./LiveBadge";
import { EVBadge } from "./EVBadge";
import { ArbBadge } from "./ArbBadge";

type MarketType = "ML" | "Spread" | "Totals";

interface EventCardProps {
  event: ConsolidatedOddsEvent;
  activeMarket: MarketType;
  valueBets?: ValueBet[];
  arbBets?: ArbitrageBet[];
}

function getOutcomeRows(activeMarket: MarketType): { key: string; label: string }[] {
  switch (activeMarket) {
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
  }
}

function isLive(event: ConsolidatedOddsEvent): boolean {
  if (event.event.status === "live") return true;
  const st = getStartTime(event.event);
  if (!st) return false;
  return Date.now() >= new Date(st).getTime();
}

function formatEventStartTime(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event, activeMarket, valueBets, arbBets }: EventCardProps) {
  const bestOdds = findBestOdds(activeMarket, event.bookmakers);
  const outcomeRows = getOutcomeRows(activeMarket);
  const live = isLive(event);
  const { home, away } = getTeamNames(event.event);

  // Find EV/arb badges for this event
  const eventValueBet = valueBets?.find((vb) => vb.eventId === event.event.id);
  const eventArbBet = arbBets?.find((ab) => ab.eventId === event.event.id);

  // Get line info from first bookmaker that has this market
  let hdp: number | undefined;
  for (const [, bkData] of Object.entries(event.bookmakers)) {
    const market = bkData.markets.find((m) => m.name === activeMarket);
    if (market?.odds[0]?.hdp != null) {
      hdp = market.odds[0].hdp;
      break;
    }
  }
  const lineDisplay = formatLine(activeMarket, hdp);

  // Check for draw in ML
  const hasDrawInML =
    activeMarket === "ML" &&
    Object.values(event.bookmakers).some((bk) => {
      const market = bk.markets.find((m) => m.name === "ML");
      return market?.odds[0]?.draw != null;
    });

  const rows = hasDrawInML
    ? [...outcomeRows, { key: "draw", label: "Draw" }]
    : outcomeRows;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-semibold text-text-primary">
            {home} vs {away}
          </span>
          {eventValueBet && <EVBadge valuePercentage={eventValueBet.valuePercentage} />}
          {eventArbBet && <ArbBadge profitPercentage={eventArbBet.profitPercentage} />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {live ? <LiveBadge /> : (
            <span className="text-xs text-text-secondary">
              {formatEventStartTime(getStartTime(event.event))}
            </span>
          )}
        </div>
      </div>

      {/* Odds grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Column headers */}
          <div className="grid gap-1 px-4 py-2" style={{ gridTemplateColumns: `120px repeat(${BOOKMAKERS.length}, 1fr)` }}>
            <div className="text-xs text-text-tertiary font-medium">
              {lineDisplay && <span className="text-text-secondary">{lineDisplay}</span>}
            </div>
            {BOOKMAKERS.map((bk) => (
              <div key={bk} className="text-center text-xs text-text-tertiary font-medium truncate">
                {bk}
              </div>
            ))}
          </div>

          {/* Outcome rows */}
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid gap-1 px-4 py-0.5"
              style={{ gridTemplateColumns: `120px repeat(${BOOKMAKERS.length}, 1fr)` }}
            >
              <div className="flex items-center text-sm text-text-secondary sticky left-0 bg-surface z-10">
                {row.label}
              </div>
              {BOOKMAKERS.map((bk) => {
                const bkData = event.bookmakers[bk];
                const market = bkData?.markets.find((m) => m.name === activeMarket);
                const outcome = market?.odds[0];
                const oddsVal = outcome?.[row.key as keyof typeof outcome];
                const decimal = oddsVal != null ? parseFloat(String(oddsVal)) : null;
                const isBest = bestOdds[row.key]?.bookmaker === bk && decimal != null;

                return (
                  <OddsCell
                    key={bk}
                    decimalOdds={isNaN(decimal as number) ? null : decimal}
                    isBest={isBest}
                    marketType={activeMarket}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
