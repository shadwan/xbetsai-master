import { NextResponse } from "next/server";
import { getConsolidatedEvent } from "@/src/lib/cache/store";
import { isDevEvent, getDevEvent } from "@/src/lib/mock/dev-fixtures";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  const { eventId } = await params;

  if (isDevEvent(eventId)) {
    const devData = getDevEvent(eventId);
    return NextResponse.json(devData);
  }

  const data = getConsolidatedEvent(eventId);
  return NextResponse.json(data);
}
