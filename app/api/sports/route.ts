import { NextResponse } from "next/server";
import { get } from "@/src/lib/cache/store";
import type { Sport } from "@/src/lib/odds-api/types";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const data = get<Sport[]>("sports");
  return NextResponse.json(data ?? []);
}
