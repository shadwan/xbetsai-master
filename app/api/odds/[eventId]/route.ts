import { NextResponse } from "next/server";
import { getConsolidatedEvent } from "@/src/lib/cache/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;
  const data = getConsolidatedEvent(eventId);
  return NextResponse.json(data);
}
