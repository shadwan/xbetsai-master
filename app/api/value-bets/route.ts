import { NextResponse } from "next/server";
import { getAllValueBets } from "@/src/lib/cache/store";
import { getDevValueBets } from "@/src/lib/mock/dev-fixtures";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const real = getAllValueBets();
  return NextResponse.json([...real, ...getDevValueBets()]);
}
