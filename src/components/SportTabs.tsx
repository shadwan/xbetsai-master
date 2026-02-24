"use client";

import { SPORTS } from "@/src/lib/odds-api/constants";

interface SportTabsProps {
  activeSport: string;
  onSportChange: (leagueSlug: string) => void;
  eventCounts?: Record<string, number>;
}

export function SportTabs({ activeSport, onSportChange, eventCounts }: SportTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {SPORTS.map((sport) => {
        const isActive = activeSport === sport.leagueSlug;
        const count = eventCounts?.[sport.leagueSlug];

        return (
          <button
            key={sport.leagueSlug}
            onClick={() => onSportChange(sport.leagueSlug)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary"
            }`}
          >
            {sport.displayName}
            {count != null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  isActive
                    ? "bg-neon-cyan/15 text-neon-cyan"
                    : "bg-elevated text-text-tertiary"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
