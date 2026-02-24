"use client";

import { useState, useMemo } from "react";
import { useProps } from "@/src/lib/hooks/use-props";
import { parseProps } from "@/src/lib/utils/props";
import { PropsTable } from "./PropsTable";
import { Skeleton } from "./Skeleton";

interface PropsSectionProps {
  eventId: string;
}

export function PropsSection({ eventId }: PropsSectionProps) {
  const { data, isLoading, isError } = useProps(eventId);
  const [activeStat, setActiveStat] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!data) return [];
    return parseProps(data);
  }, [data]);

  // Auto-select first stat type
  const selectedStat = activeStat ?? parsed[0]?.statType ?? null;
  const activeMarket = parsed.find((m) => m.statType === selectedStat);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-7 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || parsed.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
        <p className="text-text-secondary text-sm">
          {isError ? "Failed to load player props." : "No player props available for this event."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stat type selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {parsed.map((m) => (
          <button
            key={m.statType}
            onClick={() => setActiveStat(m.statType)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              m.statType === selectedStat
                ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary"
            }`}
          >
            {m.statType}
          </button>
        ))}
      </div>

      {/* Props table */}
      {activeMarket && <PropsTable market={activeMarket} />}
    </div>
  );
}
