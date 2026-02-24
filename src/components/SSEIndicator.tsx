"use client";

import { useSSEStatus } from "@/src/lib/hooks/use-sse";

export function SSEIndicator() {
  const { connected } = useSSEStatus();

  return (
    <div className="flex items-center gap-1.5" title={connected ? "Live connected" : "Disconnected"}>
      <span
        className={`relative flex h-2.5 w-2.5 ${connected ? "" : "animate-pulse-live"}`}
      >
        {connected && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-40 blur-sm" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-neon-green" : "bg-neon-red"
          }`}
        />
      </span>
      <span className="text-xs text-text-secondary">
        {connected ? "Live" : "Offline"}
      </span>
    </div>
  );
}
