export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Dynamic imports to avoid module resolution issues during build
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

  // Graceful shutdown
  const shutdown = () => {
    console.log("[instrumentation] Shutting down...");
    disconnectWebSocket();
    stopPollers();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
