import { NextResponse } from "next/server";
import { fetchOddsMovement } from "@/src/lib/realtime/poller";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;

  try {
    const data = await fetchOddsMovement(eventId);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[api/historical] Failed for ${eventId}:`, (err as Error).message);
    return NextResponse.json({ eventId, data: [] });
  }
}
