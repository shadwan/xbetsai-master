import { initSSE, addClient, removeClient } from "@/src/lib/realtime/sse-manager";

export const dynamic = "force-dynamic";

export function GET(): Response {
  initSSE();

  const stream = new ReadableStream({
    start(controller) {
      // Initial heartbeat comment (keeps connection alive)
      controller.enqueue(new TextEncoder().encode(":\n\n"));
      addClient(controller);
    },
    cancel(controller) {
      removeClient(controller as ReadableStreamDefaultController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
