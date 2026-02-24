import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEventsBySport } from "@/src/lib/cache/store";
import { SPORTS } from "@/src/lib/odds-api/constants";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest): NextResponse {
  const sport = request.nextUrl.searchParams.get("sport");

  if (sport) {
    return NextResponse.json(getEventsBySport(sport));
  }

  const result: Record<string, unknown[]> = {};
  for (const s of SPORTS) {
    result[s.leagueSlug] = getEventsBySport(s.leagueSlug);
  }
  return NextResponse.json(result);
}
