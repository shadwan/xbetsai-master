"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SPORTS, isInSeason } from "@/src/lib/odds-api/constants";
import { LeagueLogo } from "./LeagueLogo";

const SPORT_GROUP_LABELS: Record<string, string> = {
  "american-football": "Football",
  basketball: "Basketball",
  baseball: "Baseball",
  "ice-hockey": "Hockey",
};

// Ordered unique sport slugs (preserves SPORTS array order)
const SPORT_ORDER = Array.from(new Set(SPORTS.map((s) => s.sportSlug)));

interface SportTabsProps {
  activeLeague?: string; // lowercase display name from URL, undefined = home/today
}

export function SportTabs({ activeLeague }: SportTabsProps) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide p-2">
      {/* Today (home) */}
      <Link
        href="/app"
        className={cn(
          "flex shrink-0 items-center justify-center self-stretch whitespace-nowrap rounded-2xl px-7 text-base font-bold transition-colors",
          !activeLeague
            ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
            : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary",
        )}
      >
        Today
      </Link>

      {SPORT_ORDER.map((sportSlug) => {
        const leagues = SPORTS.filter((s) => s.sportSlug === sportSlug);
        const groupLabel = SPORT_GROUP_LABELS[sportSlug] ?? sportSlug;

        return (
          <div key={sportSlug} className="flex shrink-0 items-stretch gap-3">
            {/* Vertical sport divider */}
            <div className="flex items-center">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary/50 select-none"
                style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}
              >
                {groupLabel}
              </span>
            </div>

            {/* League links */}
            <div className="flex items-center gap-3">
              {leagues.map((league) => {
                const slug = league.displayName.toLowerCase();
                const isActive = activeLeague === slug;
                const offSeason = !isInSeason(league.season);

                return (
                  <Link
                    key={league.leagueSlug}
                    href={`/${slug}`}
                    className={cn(
                      "relative flex shrink-0 flex-col items-center gap-2 rounded-2xl px-5 py-3 transition-colors",
                      isActive
                        ? "bg-elevated text-neon-cyan ring-1 ring-neon-cyan/40"
                        : "bg-surface text-text-secondary hover:bg-hover hover:text-text-primary",
                      offSeason && !isActive && "opacity-40",
                    )}
                  >
                    <LeagueLogo league={league.leagueSlug} size={44} />
                    <span className="text-xs font-semibold leading-none">
                      {league.displayName}
                    </span>
                    {offSeason && (
                      <span className="text-[8px] font-medium uppercase tracking-wide text-text-tertiary leading-none">
                        Off-season
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
