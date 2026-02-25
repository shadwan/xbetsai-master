"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useProps } from "@/src/lib/hooks/use-props";
import { parsePropsEnhanced } from "@/src/lib/utils/props";
import type { ParsedPlayer } from "@/src/lib/utils/props";
import type { ValueBet } from "@/src/lib/odds-api/types";
import { Skeleton } from "@/src/components/Skeleton";
import { PlayerCard } from "./PlayerCard";

interface PlayerPropsSectionProps {
  eventId: string;
  league: string;
  valueBets?: ValueBet[];
}

export function PlayerPropsSection({
  eventId,
  league,
  valueBets = [],
}: PlayerPropsSectionProps) {
  const { data, isLoading, isError } = useProps(eventId);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const parsed = useMemo(() => {
    if (!data?.bookmakers) return null;
    return parsePropsEnhanced(data);
  }, [data]);

  // Build a set of +EV keys from value bets for cross-referencing
  const evPropKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const vb of valueBets) {
      // ValueBet has market like "Player Props - Points O/U" and outcome like "Over 24.5"
      // We extract the prop type and line to match
      const propMatch = vb.market?.match(/Player Props\s*-\s*(.+?)(?:\s+O\/U)?$/i);
      const lineMatch = vb.outcome?.match(/([\d.]+)/);
      if (propMatch && lineMatch) {
        keys.add(`${propMatch[1].trim()}|${lineMatch[1]}`);
      }
    }
    return keys;
  }, [valueBets]);

  const selectedCategory = activeCategory ?? "All";

  const displayPlayers = useMemo(() => {
    if (!parsed) return [];
    let players: ParsedPlayer[];

    if (selectedCategory === "All") {
      players = parsed.players;
    } else {
      players = parsed.byCategory[selectedCategory] ?? [];
    }

    // In edge-only mode, filter to players that have at least one edge prop
    if (!showAll) {
      return players.filter((p) =>
        p.props.some(
          (prop) =>
            prop.hasLineDiscrepancy ||
            prop.hasOddsDiscrepancy ||
            evPropKeys.has(`${prop.propType}|${prop.consensusLine}`),
        ),
      );
    }

    return players;
  }, [parsed, selectedCategory, showAll, evPropKeys]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Player Props
        </h2>
        <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            Unable to load player props. Try refreshing the page.
          </p>
        </div>
      </section>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!parsed || parsed.totalCount === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">
          Player Props
        </h2>
        <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            No player props available for this game yet. Props typically appear
            1-2 days before game time.
          </p>
        </div>
      </section>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  const categories = ["All", ...parsed.categories];

  return (
    <section className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Player Props
          </h2>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-text-tertiary">
            {parsed.totalCount}
          </span>
        </div>

        {/* Edge / All toggle */}
        <button
          onClick={() => setShowAll(!showAll)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            showAll
              ? "bg-white/[0.06] text-text-secondary ring-1 ring-white/[0.08]"
              : "bg-neon-gold/10 text-neon-gold ring-1 ring-neon-gold/20",
          )}
        >
          {showAll ? (
            <>
              <Eye size={13} />
              All props
            </>
          ) : (
            <>
              <EyeOff size={13} />
              Edges only
              {parsed.edgeCount > 0 && (
                <span className="ml-0.5 tabular-nums">
                  ({parsed.edgeCount})
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === "All" ? null : cat)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "bg-neon-gold/15 text-neon-gold ring-1 ring-neon-gold/30"
                : "bg-white/[0.04] text-text-secondary ring-1 ring-white/[0.06] hover:bg-white/[0.07] hover:text-text-primary",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Players grid — 2 cols desktop, 1 mobile */}
      <div className="grid gap-3 sm:grid-cols-2">
        {displayPlayers.map((player) => (
          <PlayerCard
            key={player.name}
            playerName={player.name}
            league={league}
            props={
              selectedCategory !== "All"
                ? player.props.filter((p) => p.propType === selectedCategory)
                : player.props
            }
            edgeOnly={!showAll}
            evPropKeys={evPropKeys}
          />
        ))}
      </div>

      {/* Empty filtered state */}
      {displayPlayers.length === 0 && (
        <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-8 text-center">
          <p className="text-sm text-text-secondary">
            {showAll
              ? `No ${selectedCategory === "All" ? "" : selectedCategory + " "}props available.`
              : "No edge opportunities found in current props."}
          </p>
          {!showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs font-medium text-neon-gold hover:underline"
            >
              Show all {parsed.totalCount} props
            </button>
          )}
        </div>
      )}
    </section>
  );
}
