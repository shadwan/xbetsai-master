"use client";

import { useMemo } from "react";
import { useHistorical } from "@/src/lib/hooks/use-historical";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "./Skeleton";

interface LineChartProps {
  eventId: string;
}

const NEON_COLORS = ["#F1E185", "#b388ff", "#39ff14", "#ffd600", "#ff3b5c"];

export function LineChart({ eventId }: LineChartProps) {
  const { data, isLoading, isError } = useHistorical(eventId);

  const { chartData, bookmakers } = useMemo(() => {
    if (!data) return { chartData: [], bookmakers: [] };

    // HistoricalEventOdds.bookmakers: Record<string, HistoricalOddsMarket[]>
    // HistoricalOddsMarket: { name, odds: HistoricalOddsSelection[], updatedAt? }
    // HistoricalOddsSelection: { [key: string]: string | number | undefined }
    const bks = new Set<string>();
    const rows: Record<string, Record<string, number>> = {};

    if (data.bookmakers) {
      for (const [bk, markets] of Object.entries(data.bookmakers)) {
        bks.add(bk);
        for (const market of markets) {
          if (!market.odds?.[0]) continue;
          const outcome = market.odds[0];
          for (const [key, val] of Object.entries(outcome)) {
            if (key === "hdp" || key === "max" || val == null) continue;
            const decimal = parseFloat(String(val));
            if (isNaN(decimal)) continue;
            const label = `${market.name} - ${key}`;
            if (!rows[label]) rows[label] = {};
            rows[label][bk] = decimal;
          }
        }
      }
    }

    const bookmakerList = Array.from(bks);
    const chartRows = Object.entries(rows).map(([label, values]) => ({
      name: label,
      ...values,
    }));

    return { chartData: chartRows, bookmakers: bookmakerList };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-lg" />;
  }

  if (isError || chartData.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <p className="text-text-secondary text-sm">
          {isError ? "Failed to load historical odds." : "No historical data available."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Bookmaker Odds Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2a3a" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#8899aa", fontSize: 11 }}
            stroke="#1c2a3a"
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fill: "#8899aa", fontSize: 11 }} stroke="#1c2a3a" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111a24",
              border: "1px solid #1c2a3a",
              borderRadius: 8,
              color: "#e8edf2",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ color: "#8899aa", fontSize: 12 }}
          />
          {bookmakers.map((bk, i) => (
            <Bar
              key={bk}
              dataKey={bk}
              fill={NEON_COLORS[i % NEON_COLORS.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
