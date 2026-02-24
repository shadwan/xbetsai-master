export async function bootstrap(): Promise<void> {
  const { initSSE } = await import("@/src/lib/realtime/sse-manager");
  const { connectWebSocket, disconnectWebSocket } = await import(
    "@/src/lib/realtime/ws-client"
  );
  const { startPollers, stopPollers } = await import(
    "@/src/lib/realtime/poller"
  );

  initSSE();
  connectWebSocket();
  await startPollers();
  console.log("[instrumentation] Startup complete");

  const shutdown = () => {
    console.log("[instrumentation] Shutting down...");
    setTimeout(() => process.exit(0), 2000).unref();
    try {
      disconnectWebSocket();
      stopPollers();
    } catch (_) {}
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
