"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { LeagueLogo } from "./LeagueLogo";

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
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary",
            )}
          >
            <LeagueLogo league={sport.leagueSlug} size={16} />
            {sport.displayName}
            {count != null && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-0.5 h-5 min-w-5 px-1.5 text-[10px]",
                  isActive
                    ? "bg-neon-cyan/15 text-neon-cyan border-transparent"
                    : "bg-elevated text-text-tertiary border-transparent",
                )}
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
