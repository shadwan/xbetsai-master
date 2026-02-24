import { NextResponse } from "next/server";
import { fetchPropsForEvent } from "@/src/lib/realtime/poller";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;

  try {
    const data = await fetchPropsForEvent(eventId);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[api/props] Failed to fetch props for ${eventId}:`, (err as Error).message);
    return NextResponse.json(
      { error: "Failed to fetch props" },
      { status: 500 },
    );
  }
}
