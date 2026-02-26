"use client";

import { useMemo, useState } from "react";
import { useHistorical } from "@/src/lib/hooks/use-historical";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";
import type { BookmakerMovement } from "@/src/lib/realtime/poller";

interface LineChartProps {
  eventId: string;
}

const MARKET_OPTIONS = ["ML", "Spread", "Totals"] as const;
type Market = (typeof MARKET_OPTIONS)[number];

const BOOKMAKER_COLORS: Record<string, string> = {
  FanDuel: "#1493ff",
  BetMGM: "#b8860b",
  Bet365: "#027b5b",
  Caesars: "#c4a032",
  DraftKings: "#53d769",
};
const FALLBACK_COLORS = ["#F1E185", "#b388ff", "#39ff14", "#ff3b5c", "#ffd600"];

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function decimalToAmerican(dec: number): string {
  if (dec <= 0) return "\u2014";
  if (dec >= 2) {
    const am = Math.round((dec - 1) * 100);
    return `+${am}`;
  }
  const am = Math.round(-100 / (dec - 1));
  return `${am}`;
}

export function LineChart({ eventId }: LineChartProps) {
  const { data, isLoading, isError } = useHistorical(eventId);
  const [selectedMarket, setSelectedMarket] = useState<Market>("ML");
  const [selectedSide, setSelectedSide] = useState<"home" | "away">("home");

  const marketData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((d: BookmakerMovement) => d.market === selectedMarket);
  }, [data, selectedMarket]);

  const availableMarkets = useMemo(() => {
    if (!data?.data) return new Set<string>();
    return new Set(data.data.map((d: BookmakerMovement) => d.market));
  }, [data]);

  const chartData = useMemo(() => {
    if (marketData.length === 0) return [];

    // Collect all timestamps across all bookmakers
    const allPoints: { ts: number; bookmaker: string; value: number }[] = [];

    for (const bm of marketData) {
      const points = [
        ...(bm.opening ? [bm.opening] : []),
        ...bm.movements,
        ...(bm.latest ? [bm.latest] : []),
      ];

      for (const pt of points) {
        const value = selectedSide === "home" ? pt.home : pt.away;
        if (value != null && value > 0) {
          allPoints.push({ ts: pt.timestamp, bookmaker: bm.bookmaker, value });
        }
      }
    }

    if (allPoints.length === 0) return [];

    // Sort by timestamp and build chart rows
    allPoints.sort((a, b) => a.ts - b.ts);

    // Group by timestamp (rounded to nearest minute)
    const timeMap = new Map<number, Record<string, number>>();
    for (const pt of allPoints) {
      const roundedTs = Math.round(pt.ts / 60) * 60;
      if (!timeMap.has(roundedTs)) {
        timeMap.set(roundedTs, {});
      }
      timeMap.get(roundedTs)![pt.bookmaker] = pt.value;
    }

    // Forward-fill: carry last known value for each bookmaker
    const bookmakers = [...new Set(allPoints.map((p) => p.bookmaker))];
    const sortedTimes = [...timeMap.keys()].sort((a, b) => a - b);
    const lastKnown: Record<string, number> = {};

    return sortedTimes.map((ts) => {
      const row: Record<string, unknown> = { time: ts, timeLabel: formatTime(ts) };
      const values = timeMap.get(ts)!;
      for (const bk of bookmakers) {
        if (values[bk] != null) lastKnown[bk] = values[bk];
        if (lastKnown[bk] != null) row[bk] = lastKnown[bk];
      }
      return row;
    });
  }, [marketData, selectedSide]);

  const bookmakers = useMemo(() => {
    if (chartData.length === 0) return [];
    const keys = new Set<string>();
    for (const row of chartData) {
      for (const key of Object.keys(row)) {
        if (key !== "time" && key !== "timeLabel") keys.add(key);
      }
    }
    return [...keys];
  }, [chartData]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-lg" />;
  }

  if (isError || !data?.data || data.data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <p className="text-text-secondary text-sm">
          No line movement data available yet.
        </p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <p className="text-text-secondary text-sm">
          No movement data for {selectedMarket} ({selectedSide}).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      {/* Market + side selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5 ring-1 ring-white/[0.08]">
          {MARKET_OPTIONS.filter((m) => availableMarkets.has(m)).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarket(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                selectedMarket === m
                  ? "bg-white/[0.1] text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5 ring-1 ring-white/[0.08]">
          {(["home", "away"] as const).map((side) => (
            <button
              key={side}
              onClick={() => setSelectedSide(side)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors capitalize",
                selectedSide === side
                  ? "bg-white/[0.1] text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3a" />
          <XAxis
            dataKey="timeLabel"
            tick={{ fill: "#8899aa", fontSize: 11 }}
            stroke="#1c2a3a"
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#8899aa", fontSize: 11 }}
            stroke="#1c2a3a"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => decimalToAmerican(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111a24",
              border: "1px solid #1c2a3a",
              borderRadius: 8,
              color: "#e8edf2",
              fontSize: 12,
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => [
              value != null ? `${decimalToAmerican(Number(value))} (${Number(value).toFixed(2)})` : "\u2014",
              String(name),
            ]) as never}
            labelFormatter={(label) => String(label)}
          />
          <Legend wrapperStyle={{ color: "#8899aa", fontSize: 12 }} />
          {bookmakers.map((bk, i) => (
            <Line
              key={bk}
              type="stepAfter"
              dataKey={bk}
              stroke={BOOKMAKER_COLORS[bk] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
