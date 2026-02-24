"use client";

import { useQuery } from "@tanstack/react-query";
import { getEspnTeamId } from "@/src/lib/utils/espn-ids";

// ── Record formatting ────────────────────────────────────────────────────────

/**
 * Parse "31-26" → "31W – 26L", "31-26-5" → "31W – 26L – 5OT"
 */
function formatRecord(raw: string): string {
  const parts = raw.split("-").map((s) => s.trim());
  if (parts.length === 2) {
    return `${parts[0]}W – ${parts[1]}L`;
  }
  if (parts.length === 3) {
    return `${parts[0]}W – ${parts[1]}L – ${parts[2]}OT`;
  }
  return raw;
}

// ── Standing formatting ──────────────────────────────────────────────────────

// NBA divisions → conference
const NBA_EAST_DIVISIONS = new Set(["atlantic", "central", "southeast"]);
const NBA_WEST_DIVISIONS = new Set(["pacific", "southwest", "northwest"]);

// NHL divisions → conference
const NHL_EAST_DIVISIONS = new Set(["atlantic", "metropolitan"]);
const NHL_WEST_DIVISIONS = new Set(["central", "pacific"]);

/**
 * Transform ESPN standingSummary into a shorter conference-level label.
 * "4th in Atlantic Division" → "4th in East"
 * "2nd in NFC North" → "2nd in NFC"
 * Falls back to raw string if unparseable.
 */
function formatStanding(raw: string, leagueSlug: string): string {
  // Extract rank and division/conference from patterns like "4th in Atlantic Division"
  const match = raw.match(/^(\d+\w+)\s+in\s+(.+)$/i);
  if (!match) return raw;

  const rank = match[1];
  const division = match[2].replace(/\s*Division$/i, "").trim();
  const divLower = division.toLowerCase();

  if (leagueSlug === "usa-nba") {
    if (NBA_EAST_DIVISIONS.has(divLower)) return `${rank} in East`;
    if (NBA_WEST_DIVISIONS.has(divLower)) return `${rank} in West`;
  }

  if (leagueSlug === "usa-nhl") {
    if (NHL_EAST_DIVISIONS.has(divLower)) return `${rank} in East`;
    if (NHL_WEST_DIVISIONS.has(divLower)) return `${rank} in West`;
  }

  if (leagueSlug === "usa-nfl") {
    // "NFC North" → "NFC", "AFC East" → "AFC"
    if (divLower.startsWith("nfc")) return `${rank} in NFC`;
    if (divLower.startsWith("afc")) return `${rank} in AFC`;
  }

  // College or unrecognized — return as-is but without "Division" suffix
  return `${rank} in ${division}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface TeamInfoResult {
  record: string | null;
  standing: string | null;
  isLoading: boolean;
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchTeamInfo(
  leagueSlug: string,
  espnTeamId: string,
): Promise<{ record: string | null; standing: string | null }> {
  const res = await fetch(
    `/api/espn/team/${espnTeamId}?league=${encodeURIComponent(leagueSlug)}`,
  );
  if (!res.ok) return { record: null, standing: null };
  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTeamInfo(
  leagueSlug: string,
  teamName: string,
): TeamInfoResult {
  const espnId = getEspnTeamId(leagueSlug, teamName);

  const { data, isLoading } = useQuery({
    queryKey: ["espn-team", leagueSlug, teamName],
    queryFn: () => fetchTeamInfo(leagueSlug, espnId!),
    staleTime: 300_000, // 5 min
    enabled: !!leagueSlug && !!teamName && !!espnId,
  });

  return {
    record: data?.record ? formatRecord(data.record) : null,
    standing: data?.standing ? formatStanding(data.standing, leagueSlug) : null,
    isLoading: isLoading && !!espnId,
  };
}
