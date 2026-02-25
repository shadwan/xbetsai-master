import { NextRequest, NextResponse } from "next/server";
import { fetchGameRoster, type GameRoster } from "@/src/lib/espn/client";

export const dynamic = "force-dynamic";

// ── In-memory cache (5 min TTL) ─────────────────────────────────────────────

type CacheEntry = {
  data: GameRoster | null;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1_000;

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") ?? "";
  const homeId = request.nextUrl.searchParams.get("homeId") ?? "";
  const awayId = request.nextUrl.searchParams.get("awayId") ?? "";

  if (!league || !homeId || !awayId) {
    return NextResponse.json(null);
  }

  const cacheKey = `roster:${league}:${homeId}:${awayId}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const roster = await fetchGameRoster(league, homeId, awayId);
    cache.set(cacheKey, { data: roster, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json(roster);
  } catch {
    return NextResponse.json(null);
  }
}
