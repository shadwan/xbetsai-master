import { NextResponse } from "next/server";
import { getAllValueBets } from "@/src/lib/cache/store";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(getAllValueBets());
}
