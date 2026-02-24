import { NextRequest, NextResponse } from "next/server";
import { fetchTeamInfo } from "@/src/lib/espn/client";

export const dynamic = "force-dynamic";

// ── In-memory cache (5 min TTL) ─────────────────────────────────────────────

type CacheEntry = {
  data: { record: string | null; standing: string | null };
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1_000; // 5 minutes

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const league = request.nextUrl.searchParams.get("league") ?? "";

  if (!teamId || !league) {
    return NextResponse.json(
      { record: null, standing: null },
      { status: 400 },
    );
  }

  const cacheKey = `${league}:${teamId}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const info = await fetchTeamInfo(league, teamId);
    cache.set(cacheKey, { data: info, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ record: null, standing: null });
  }
}
