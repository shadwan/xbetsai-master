import { NextResponse } from "next/server";
import { get } from "@/src/lib/cache/store";
import type { ArbitrageBet } from "@/src/lib/odds-api/types";
import { getDevArbBets } from "@/src/lib/mock/dev-fixtures";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const data = get<ArbitrageBet[]>("arb-bets");
  return NextResponse.json([...(data ?? []), ...getDevArbBets()]);
}
