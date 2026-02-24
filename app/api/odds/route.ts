import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllConsolidatedEvents } from "@/src/lib/cache/store";
import { SPORTS } from "@/src/lib/odds-api/constants";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest): NextResponse {
  const sport = request.nextUrl.searchParams.get("sport");

  if (sport) {
    return NextResponse.json(getAllConsolidatedEvents(sport));
  }

  const all = SPORTS.flatMap((s) => getAllConsolidatedEvents(s.leagueSlug));
  return NextResponse.json(all);
}
