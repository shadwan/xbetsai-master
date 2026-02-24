import { NextResponse } from "next/server";
import { get } from "@/src/lib/cache/store";
import type { ArbitrageBet } from "@/src/lib/odds-api/types";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const data = get<ArbitrageBet[]>("arb-bets");
  return NextResponse.json(data ?? []);
}
