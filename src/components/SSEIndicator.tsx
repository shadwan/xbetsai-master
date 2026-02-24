"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSSEStatus } from "@/src/lib/hooks/use-sse";

export function SSEIndicator() {
  const { connected } = useSSEStatus();

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent",
        connected
          ? "bg-neon-green/10 text-neon-green"
          : "bg-neon-red/10 text-neon-red",
      )}
      title={connected ? "Live connected" : "Disconnected"}
    >
      <span
        className={cn("relative flex h-2 w-2", !connected && "animate-pulse-live")}
      >
        {connected && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-40 blur-sm" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            connected ? "bg-neon-green" : "bg-neon-red",
          )}
        />
      </span>
      {connected ? "Live" : "Offline"}
    </Badge>
  );
}
