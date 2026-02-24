"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SPORTS } from "@/src/lib/odds-api/constants";
import { LeagueLogo } from "./LeagueLogo";

interface SportTabsProps {
  activeLeague?: string; // lowercase display name from URL, undefined = home/all
  eventCounts?: Record<string, number>;
}

export function SportTabs({ activeLeague, eventCounts }: SportTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <Link
        href="/"
        className={cn(
          "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !activeLeague
            ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
            : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary",
        )}
      >
        All
      </Link>
      {SPORTS.map((sport) => {
        const slug = sport.displayName.toLowerCase();
        const isActive = activeLeague === slug;
        const count = eventCounts?.[sport.leagueSlug];

        return (
          <Link
            key={sport.leagueSlug}
            href={`/${slug}`}
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
          </Link>
        );
      })}
    </div>
  );
}
