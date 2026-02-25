import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ── ESPN sport/league mapping ───────────────────────────────────────────────

const ESPN_SPORTS: Record<string, { sport: string; league: string }> = {
  "usa-nba": { sport: "basketball", league: "nba" },
  "usa-nfl": { sport: "football", league: "nfl" },
  "usa-mlb": { sport: "baseball", league: "mlb" },
  "usa-nhl": { sport: "hockey", league: "nhl" },
  "usa-ncaaf": { sport: "football", league: "college-football" },
  "usa-ncaab": { sport: "basketball", league: "mens-college-basketball" },
};

// ── In-memory cache (24hr TTL) ──────────────────────────────────────────────

type CacheEntry = {
  headshotUrl: string | null;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1_000;

// ── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") ?? "";
  const league = request.nextUrl.searchParams.get("league") ?? "";

  if (!name || !league) {
    return NextResponse.json({ headshotUrl: null });
  }

  const cacheKey = `${league}:${name.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ headshotUrl: cached.headshotUrl });
  }

  const espn = ESPN_SPORTS[league];
  if (!espn) {
    cache.set(cacheKey, { headshotUrl: null, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json({ headshotUrl: null });
  }

  try {
    // Use ESPN search API to find the player
    const searchUrl = `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=5&type=player&sport=${espn.sport}&league=${espn.league}`;

    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      cache.set(cacheKey, { headshotUrl: null, expiresAt: Date.now() + CACHE_TTL });
      return NextResponse.json({ headshotUrl: null });
    }

    const json = await res.json();

    // Navigate the search response to find athlete results
    const results = json?.results as Array<Record<string, unknown>> | undefined;
    if (!results || results.length === 0) {
      cache.set(cacheKey, { headshotUrl: null, expiresAt: Date.now() + CACHE_TTL });
      return NextResponse.json({ headshotUrl: null });
    }

    // Find the "athletes" section in results
    let athletes: Array<Record<string, unknown>> = [];
    for (const section of results) {
      if (section.type === "athlete" || section.displayName === "Athletes") {
        athletes = (section.contents ?? section.items ?? []) as Array<Record<string, unknown>>;
        break;
      }
    }

    // Fallback: check if results themselves are athletes
    if (athletes.length === 0) {
      athletes = results;
    }

    // Find the best matching athlete
    const nameLower = name.toLowerCase();
    let headshotUrl: string | null = null;

    for (const athlete of athletes) {
      const athleteName = (
        (athlete.displayName as string) ??
        (athlete.title as string) ??
        (athlete.name as string) ??
        ""
      ).toLowerCase();

      if (athleteName === nameLower || athleteName.includes(nameLower) || nameLower.includes(athleteName)) {
        // Try to extract headshot from various response shapes
        const uid = athlete.uid as string | undefined;
        const id = athlete.id as string | undefined;
        const link = athlete.link as string | undefined;
        const image = athlete.image as string | undefined;

        if (image) {
          headshotUrl = image;
          break;
        }

        // Extract player ID from uid ("s:40~l:46~a:4432") or id
        let playerId = id;
        if (!playerId && uid) {
          const match = uid.match(/a:(\d+)/);
          if (match) playerId = match[1];
        }
        if (!playerId && link) {
          const match = link.match(/\/id\/(\d+)/);
          if (match) playerId = match[1];
        }

        if (playerId) {
          headshotUrl = `https://a.espncdn.com/i/headshots/${espn.sport}/players/full/${playerId}.png`;
          break;
        }
      }
    }

    cache.set(cacheKey, { headshotUrl, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json({ headshotUrl });
  } catch {
    cache.set(cacheKey, { headshotUrl: null, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json({ headshotUrl: null });
  }
}
