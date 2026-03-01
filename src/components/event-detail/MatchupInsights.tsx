"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ConsolidatedOddsEvent, ValueBet, ArbitrageBet } from "@/src/lib/odds-api/types";
import { getTeamNames, getLeagueSlug } from "@/src/lib/utils/odds";
import { getTeamMeta } from "@/src/lib/utils/espn-ids";
import { computeMarketConsensus } from "@/src/lib/utils/predictions";
import { TeamLogo } from "@/src/components/TeamLogo";
import { Skeleton } from "@/src/components/Skeleton";
import { SummaryCard } from "@/src/components/event-detail/SummaryCard";
import { useTeamInfo } from "@/src/lib/hooks/use-team-info";
import { useEspnPrediction } from "@/src/lib/hooks/use-espn-prediction";

interface MatchupInsightsProps {
  event: ConsolidatedOddsEvent;
  valueBets: ValueBet[];
  arbBets: ArbitrageBet[];
}

export function MatchupInsights({ event, valueBets, arbBets }: MatchupInsightsProps) {
  const { home, away } = getTeamNames(event.event);
  const leagueSlug = getLeagueSlug(event.event);

  const awayMeta = getTeamMeta(leagueSlug, away);
  const homeMeta = getTeamMeta(leagueSlug, home);

  const awayNickname = awayMeta?.nickname ?? (away.split(/\s+/).pop() ?? away);
  const homeNickname = homeMeta?.nickname ?? (home.split(/\s+/).pop() ?? home);
  const awayColor = awayMeta?.color ?? "#556677";
  const homeColor = homeMeta?.color ?? "#556677";

  // ESPN team info
  const awayInfo = useTeamInfo(leagueSlug, away);
  const homeInfo = useTeamInfo(leagueSlug, home);

  // ESPN game prediction
  const espnPred = useEspnPrediction(leagueSlug, home, away);

  // Market consensus
  const consensus = useMemo(() => computeMarketConsensus(event), [event]);
  const awayPct = consensus ? Math.round(consensus.away.probability * 100) : null;
  const homePct = consensus ? Math.round(consensus.home.probability * 100) : null;

  const hasStandings =
    awayInfo.isLoading || homeInfo.isLoading || awayInfo.record || homeInfo.record;
  const hasPredictions =
    consensus || espnPred.isLoading || espnPred.homeWinProb != null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:[&>*]:flex-1 sm:[&>*]:min-w-0">
      {/* ── Top Signal Card ──────────────────────────────────────────── */}
      <SummaryCard
        event={event}
        valueBets={valueBets}
        arbBets={arbBets}
      />

      {/* ── Predictions Card ────────────────────────────────────────── */}
      {hasPredictions && (
        <div className="group relative overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-base font-bold uppercase tracking-[0.15em] text-text-primary">
              Win Probability
            </h3>
          </div>

          <div className="space-y-3 px-5 pb-4 pt-2">
            {/* Market Consensus */}
            {consensus && awayPct != null && homePct != null && (
              <PredictionRow
                label="Market"
                awayPct={awayPct}
                homePct={homePct}
                awayTeam={away}
                homeTeam={home}
                league={leagueSlug}
                bookmakerCount={consensus.bookmakerCount}
              />
            )}

            {/* ESPN Prediction */}
            {espnPred.isLoading && (
              <div className="flex items-center justify-between gap-3 py-2">
                <Skeleton className="h-5 w-14 rounded" />
                <span className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-base font-bold uppercase tracking-wider text-text-secondary ring-1 ring-white/10">
                  ESPN BPI
                </span>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            )}
            {!espnPred.isLoading && espnPred.homeWinProb != null && espnPred.awayWinProb != null && (
              <PredictionRow
                label="ESPN BPI"
                awayPct={Math.round(espnPred.awayWinProb)}
                homePct={Math.round(espnPred.homeWinProb)}
                awayTeam={away}
                homeTeam={home}
                league={leagueSlug}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Standings Card ──────────────────────────────────────────── */}
      {hasStandings && (
        <div className="group relative overflow-hidden rounded-xl border border-border-bright/40 bg-[#0a1018]">
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-base font-bold uppercase tracking-[0.15em] text-text-primary">
              Team Standings
            </h3>
          </div>

          <div className="divide-y divide-white/[0.08] px-5 pb-4">
            {/* Away team row */}
            <div className="flex items-center gap-3.5 py-3.5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-lg opacity-25"
                  style={{ backgroundColor: awayColor }}
                />
                <TeamLogo
                  league={leagueSlug}
                  teamName={away}
                  size={36}
                  className="relative"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-text-primary leading-tight">
                  {awayNickname}
                </p>
                {awayInfo.isLoading ? (
                  <div className="mt-1.5 flex gap-3">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {awayInfo.record && (
                      <span className="text-base tabular-nums text-text-primary">
                        {awayInfo.record}
                      </span>
                    )}
                    {awayInfo.standing && (
                      <span className="text-base text-text-secondary">
                        {awayInfo.standing}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Home team row */}
            <div className="flex items-center gap-3.5 py-3.5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-lg opacity-25"
                  style={{ backgroundColor: homeColor }}
                />
                <TeamLogo
                  league={leagueSlug}
                  teamName={home}
                  size={36}
                  className="relative"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-text-primary leading-tight">
                  {homeNickname}
                </p>
                {homeInfo.isLoading ? (
                  <div className="mt-1.5 flex gap-3">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {homeInfo.record && (
                      <span className="text-base tabular-nums text-text-primary">
                        {homeInfo.record}
                      </span>
                    )}
                    {homeInfo.standing && (
                      <span className="text-base text-text-secondary">
                        {homeInfo.standing}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Prediction Row ──────────────────────────────────────────────────────────── */

const BAR_WIN = "#F1E185"; // neon-gold
const BAR_LOSE = "#1e2d3d"; // muted slate — complements gold + dark bg

interface PredictionRowProps {
  label: string;
  awayPct: number;
  homePct: number;
  awayTeam: string;
  homeTeam: string;
  league: string;
  bookmakerCount?: number;
}

function PredictionRow({
  label,
  awayPct,
  homePct,
  awayTeam,
  homeTeam,
  league,
  bookmakerCount,
}: PredictionRowProps) {
  const awayFav = awayPct > homePct;
  const homeFav = homePct > awayPct;

  return (
    <div className="space-y-2">
      {/* Source label */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-base font-bold uppercase tracking-wider text-text-secondary ring-1 ring-white/10">
          {label}
        </span>
        {bookmakerCount != null && (
          <span className="text-base text-text-secondary">
            {bookmakerCount} books
          </span>
        )}
      </div>

      {/* Bar + logos + percentages */}
      <div className="flex items-center gap-2.5">
        {/* Away: logo + pct */}
        <div className="flex items-center gap-2">
          <TeamLogo league={league} teamName={awayTeam} size={22} className="shrink-0" />
          <span
            className={cn(
              "w-12 text-right text-lg font-[900] tabular-nums",
              awayFav ? "text-neon-gold" : "text-text-secondary",
            )}
          >
            {awayPct}%
          </span>
        </div>

        {/* Split bar */}
        <div className="relative flex h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{
              width: `${awayPct}%`,
              backgroundColor: awayFav ? BAR_WIN : BAR_LOSE,
            }}
          />
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${homePct}%`,
              backgroundColor: homeFav ? BAR_WIN : BAR_LOSE,
            }}
          />
        </div>

        {/* Home: pct + logo */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-12 text-left text-lg font-[900] tabular-nums",
              homeFav ? "text-neon-gold" : "text-text-secondary",
            )}
          >
            {homePct}%
          </span>
          <TeamLogo league={league} teamName={homeTeam} size={22} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
