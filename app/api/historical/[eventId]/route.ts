import { NextResponse } from "next/server";
import { fetchHistoricalOdds } from "@/src/lib/realtime/poller";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;

  const data = await fetchHistoricalOdds(eventId);
  if (!data) {
    return NextResponse.json(
      { error: "Historical odds not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
