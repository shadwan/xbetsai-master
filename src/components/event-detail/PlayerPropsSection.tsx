"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, ChevronDown, Eye, EyeOff, X } from "lucide-react";
import { useProps } from "@/src/lib/hooks/use-props";
import { useGameRoster } from "@/src/lib/hooks/use-game-roster";
import { parsePropsEnhanced } from "@/src/lib/utils/props";
import type { PlayerProp } from "@/src/lib/utils/props";
import type { ValueBet } from "@/src/lib/odds-api/types";
import type { RosterPlayer } from "@/src/lib/espn/client";
import { decimalToAmerican } from "@/src/lib/utils/odds";
import { abbreviateBookmaker } from "@/src/lib/utils/props";
import { Skeleton } from "@/src/components/Skeleton";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamLogo } from "@/src/components/TeamLogo";

interface PlayerPropsSectionProps {
  eventId: string;
  league: string;
  valueBets?: ValueBet[];
  homeTeam?: string;
  awayTeam?: string;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(jr\.?|sr\.?|ii|iii|iv)\b/gi, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEdge(prop: PlayerProp, evPropKeys: Set<string>): boolean {
  return (
    prop.hasLineDiscrepancy ||
    prop.hasOddsDiscrepancy ||
    evPropKeys.has(`${prop.propType}|${prop.consensusLine}`)
  );
}

function formatOdds(decimal: number): string {
  if (decimal <= 0) return "\u2014";
  const am = decimalToAmerican(decimal);
  return am > 0 ? `+${am}` : `${am}`;
}

type TeamFilter = "home" | "away";

interface DisplayPlayer {
  id: string;
  name: string;
  rosterPlayer: RosterPlayer;
  team: "home" | "away";
  allProps: PlayerProp[];
  edgeProps: PlayerProp[];
}

// ── Props Popup ─────────────────────────────────────────────────────────────

function PropsPopup({
  player,
  league,
  evPropKeys,
  onClose,
}: {
  player: DisplayPlayer;
  league: string;
  evPropKeys: Set<string>;
  onClose: () => void;
}) {
  const [showEdgesOnly, setShowEdgesOnly] = useState(true);
  const [expandedProp, setExpandedProp] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const displayProps = showEdgesOnly ? player.edgeProps : player.allProps;
  const hasAnyProps = player.allProps.length > 0;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border-bright/40 bg-[#0a1220] shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-text-tertiary hover:bg-white/[0.06] hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>

        {/* Player header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <PlayerAvatar
            playerName={player.name}
            league={league}
            size={52}
            headshotUrl={player.rosterPlayer.headshotUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-text-primary truncate">
                {player.name}
              </p>
              {player.rosterPlayer.position && (
                <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-bold text-text-tertiary">
                  {player.rosterPlayer.position}
                </span>
              )}
              {player.rosterPlayer.jersey && (
                <span className="text-xs text-text-tertiary">
                  #{player.rosterPlayer.jersey}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {player.edgeProps.length > 0
                ? `${player.edgeProps.length} edge${player.edgeProps.length !== 1 ? "s" : ""}`
                : "No edges"}
              {player.allProps.length > 0 && (
                <span className="text-text-tertiary/50">
                  {" "}/{" "}{player.allProps.length} prop{player.allProps.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Edges / All segmented toggle */}
        {hasAnyProps && (
          <div className="flex justify-center px-5 py-3 border-b border-white/[0.04]">
            <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5 ring-1 ring-white/[0.08]">
              <button
                onClick={() => setShowEdgesOnly(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors",
                  showEdgesOnly
                    ? "bg-neon-gold/15 text-neon-gold shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                <EyeOff size={13} />
                Edges only
              </button>
              <button
                onClick={() => setShowEdgesOnly(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-colors",
                  !showEdgesOnly
                    ? "bg-white/[0.1] text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                <Eye size={13} />
                All props
              </button>
            </div>
          </div>
        )}

        {/* Prop rows or empty state */}
        {!hasAnyProps ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-text-secondary">
              No props available for this player.
            </p>
          </div>
        ) : displayProps.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-text-secondary">
              No edge opportunities for this player.
            </p>
            <button
              onClick={() => setShowEdgesOnly(false)}
              className="mt-2 text-xs font-medium text-neon-gold hover:underline"
            >
              Show all {player.allProps.length} props
            </button>
          </div>
        ) : (
          <div>
            {displayProps.map((prop) => {
              const isEdgeProp = hasEdge(prop, evPropKeys);
              const isExpanded = expandedProp === prop.propType;
              const overBetter =
                prop.bestOver && prop.bestUnder
                  ? prop.bestOver.odds > prop.bestUnder.odds
                  : false;
              const underBetter =
                prop.bestOver && prop.bestUnder
                  ? prop.bestUnder.odds > prop.bestOver.odds
                  : false;
              const isEV = evPropKeys.has(
                `${prop.propType}|${prop.consensusLine}`,
              );

              return (
                <div
                  key={prop.propType}
                  className={cn(
                    "border-b border-white/[0.04] last:border-b-0",
                    !isEdgeProp && "opacity-50",
                  )}
                >
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px] font-semibold text-text-primary">
                        {prop.propType}
                      </span>
                      <span className="text-xs tabular-nums text-text-secondary">
                        {prop.consensusLine}
                      </span>
                      {prop.hasLineDiscrepancy && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-neon-yellow/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-neon-yellow ring-1 ring-neon-yellow/20">
                          <AlertTriangle size={10} />
                          LINE
                        </span>
                      )}
                      {prop.hasOddsDiscrepancy && (
                        <span className="rounded bg-blue-400/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-400/20">
                          VALUE
                        </span>
                      )}
                      {isEV && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-neon-green/[0.1] px-1.5 py-0.5 text-[10px] font-bold text-neon-green ring-1 ring-neon-green/20">
                          <TrendingUp size={10} />
                          +EV
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-1.5",
                          overBetter
                            ? "bg-neon-green/[0.06] ring-1 ring-neon-green/15"
                            : "bg-white/[0.025] ring-1 ring-white/[0.05]",
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          Over
                        </span>
                        <div className="text-right">
                          <span
                            className={cn(
                              "text-base font-[900] tabular-nums",
                              overBetter ? "text-neon-green" : "text-text-primary",
                            )}
                          >
                            {prop.bestOver ? formatOdds(prop.bestOver.odds) : "\u2014"}
                          </span>
                          {prop.bestOver && (
                            <span className="ml-1.5 text-[10px] text-text-tertiary">
                              {abbreviateBookmaker(prop.bestOver.bookmaker)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-1.5",
                          underBetter
                            ? "bg-neon-green/[0.06] ring-1 ring-neon-green/15"
                            : "bg-white/[0.025] ring-1 ring-white/[0.05]",
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                          Under
                        </span>
                        <div className="text-right">
                          <span
                            className={cn(
                              "text-base font-[900] tabular-nums",
                              underBetter ? "text-neon-green" : "text-text-primary",
                            )}
                          >
                            {prop.bestUnder ? formatOdds(prop.bestUnder.odds) : "\u2014"}
                          </span>
                          {prop.bestUnder && (
                            <span className="ml-1.5 text-[10px] text-text-tertiary">
                              {abbreviateBookmaker(prop.bestUnder.bookmaker)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {prop.lines.length > 1 && (
                      <button
                        onClick={() =>
                          setExpandedProp(isExpanded ? null : prop.propType)
                        }
                        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded py-0.5 text-[11px] font-medium text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary transition-colors"
                      >
                        {isExpanded ? "Hide" : `${prop.lines.length}`} books
                        <ChevronDown
                          size={12}
                          className={cn(
                            "transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && prop.lines.length > 1 && (
                    <div className="border-t border-white/[0.03] bg-white/[0.01] px-5 py-2">
                      <div className="space-y-1">
                        {prop.lines.map((l) => (
                          <div
                            key={l.bookmaker}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-text-secondary">
                              {abbreviateBookmaker(l.bookmaker)}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-text-tertiary tabular-nums">
                                {l.hdp}
                              </span>
                              <span
                                className={cn(
                                  "w-12 text-right font-mono tabular-nums",
                                  prop.bestOver?.bookmaker === l.bookmaker &&
                                    prop.bestOver?.odds === l.over
                                    ? "text-neon-green"
                                    : "text-text-primary",
                                )}
                              >
                                {formatOdds(l.over)}
                              </span>
                              <span
                                className={cn(
                                  "w-12 text-right font-mono tabular-nums",
                                  prop.bestUnder?.bookmaker === l.bookmaker &&
                                    prop.bestUnder?.odds === l.under
                                    ? "text-neon-green"
                                    : "text-text-primary",
                                )}
                              >
                                {formatOdds(l.under)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Section ────────────────────────────────────────────────────────────

export function PlayerPropsSection({
  eventId,
  league,
  valueBets = [],
  homeTeam,
  awayTeam,
}: PlayerPropsSectionProps) {
  const { data, isLoading, isError } = useProps(eventId);
  const { roster, isLoading: rosterLoading } = useGameRoster(league, homeTeam ?? "", awayTeam ?? "");

  const [teamFilter, setTeamFilter] = useState<TeamFilter>("away");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!data?.bookmakers) return null;
    return parsePropsEnhanced(data);
  }, [data]);

  const evPropKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const vb of valueBets) {
      const propMatch = vb.market?.match(/Player Props\s*-\s*(.+?)(?:\s+O\/U)?$/i);
      const lineMatch = vb.outcome?.match(/([\d.]+)/);
      if (propMatch && lineMatch) {
        keys.add(`${propMatch[1].trim()}|${lineMatch[1]}`);
      }
    }
    return keys;
  }, [valueBets]);

  const playerPropsMap = useMemo(() => {
    const map = new Map<string, { allProps: PlayerProp[]; edgeProps: PlayerProp[] }>();
    if (!parsed) return map;

    for (const p of parsed.players) {
      const edges = p.props.filter((prop) => hasEdge(prop, evPropKeys));
      map.set(normalizeName(p.name), { allProps: p.props, edgeProps: edges });
    }
    return map;
  }, [parsed, evPropKeys]);

  const allPlayers = useMemo((): DisplayPlayer[] => {
    if (!roster) return [];

    function buildList(
      rosterPlayers: RosterPlayer[],
      team: "home" | "away",
    ): DisplayPlayer[] {
      return rosterPlayers
        .filter((rp) => rp.active)
        .map((rp) => {
          const norm = normalizeName(rp.name);
          const normShort = normalizeName(rp.shortName);
          const data = playerPropsMap.get(norm) ?? playerPropsMap.get(normShort) ?? { allProps: [], edgeProps: [] };
          return { id: rp.id, name: rp.name, rosterPlayer: rp, team, allProps: data.allProps, edgeProps: data.edgeProps };
        })
        .sort((a, b) => {
          if (a.edgeProps.length > 0 && b.edgeProps.length === 0) return -1;
          if (a.edgeProps.length === 0 && b.edgeProps.length > 0) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    return [
      ...buildList(roster.awayTeam.players, "away"),
      ...buildList(roster.homeTeam.players, "home"),
    ];
  }, [roster, playerPropsMap]);

  const filteredPlayers = useMemo(
    () => allPlayers.filter((p) => p.team === teamFilter),
    [allPlayers, teamFilter],
  );

  const selectedPlayer = useMemo(
    () => filteredPlayers.find((p) => p.id === selectedPlayerId) ?? null,
    [filteredPlayers, selectedPlayerId],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || rosterLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-6 w-40 rounded" />
        <div className="flex justify-center gap-6">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Player Edges</h2>
        <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            Unable to load player props. Try refreshing the page.
          </p>
        </div>
      </section>
    );
  }

  if (!roster || allPlayers.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Player Edges</h2>
        <div className="rounded-xl border border-border-bright/40 bg-[#0a1018] px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            {!parsed || parsed.totalCount === 0
              ? "No player props available for this game yet. Props typically appear 1-2 days before game time."
              : "Roster data unavailable."}
          </p>
        </div>
      </section>
    );
  }

  const totalEdges = allPlayers.reduce((s, p) => s + p.edgeProps.length, 0);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Player Edges</h2>
        {totalEdges > 0 && (
          <span className="rounded-full bg-neon-gold/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-neon-gold ring-1 ring-neon-gold/20">
            {totalEdges}
          </span>
        )}
      </div>

      {/* Team selector */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setTeamFilter("away")}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-colors",
            teamFilter === "away"
              ? "bg-neon-cyan/10 ring-1 ring-neon-cyan/30"
              : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06]",
          )}
        >
          <TeamLogo league={league} teamName={awayTeam ?? "Away"} size={28} />
          <span
            className={cn(
              "text-sm font-semibold",
              teamFilter === "away" ? "text-neon-cyan" : "text-text-secondary",
            )}
          >
            {roster.awayTeam.name}
          </span>
        </button>

        <span className="text-xs font-bold text-text-tertiary/40">vs</span>

        <button
          onClick={() => setTeamFilter("home")}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-colors",
            teamFilter === "home"
              ? "bg-neon-cyan/10 ring-1 ring-neon-cyan/30"
              : "bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06]",
          )}
        >
          <TeamLogo league={league} teamName={homeTeam ?? "Home"} size={28} />
          <span
            className={cn(
              "text-sm font-semibold",
              teamFilter === "home" ? "text-neon-cyan" : "text-text-secondary",
            )}
          >
            {roster.homeTeam.name}
          </span>
        </button>
      </div>

      {/* Player card grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {filteredPlayers.map((player) => {
          const hasEdges = player.edgeProps.length > 0;
          return (
            <button
              key={player.id}
              onClick={() => setSelectedPlayerId(player.id)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all hover:scale-[1.03]",
                hasEdges
                  ? "border-neon-gold/20 bg-neon-gold/[0.03] hover:border-neon-gold/40 hover:bg-neon-gold/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] opacity-50",
              )}
            >
              <PlayerAvatar
                playerName={player.name}
                league={league}
                size={48}
                headshotUrl={player.rosterPlayer.headshotUrl}
              />
              <div className="min-w-0 w-full">
                <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                  {player.name}
                </p>
                <p className="mt-0.5 text-[11px] text-text-tertiary">
                  {player.rosterPlayer.position}
                  {player.rosterPlayer.jersey && ` #${player.rosterPlayer.jersey}`}
                </p>
              </div>
              {hasEdges && (
                <span className="rounded-full bg-neon-gold/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-neon-gold ring-1 ring-neon-gold/20">
                  {player.edgeProps.length} edge{player.edgeProps.length !== 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Props popup */}
      {selectedPlayer && (
        <PropsPopup
          player={selectedPlayer}
          league={league}
          evPropKeys={evPropKeys}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </section>
  );
}
