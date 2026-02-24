// ---------------------------------------------------------------------------
// WebSocket client — connects to Odds-API WS feed
// ---------------------------------------------------------------------------

import WebSocket from "ws";
import * as cache from "@/src/lib/cache/store";
import { emit } from "@/src/lib/realtime/bus";
import {
  WS_URL,
  WS_MARKETS,
  WS_SPORTS,
  CACHE_TTL,
} from "@/src/lib/odds-api/constants";
import type {
  WsMessage,
  WsCreatedMessage,
  WsUpdatedMessage,
} from "@/src/lib/odds-api/types";

// ── Module state ──────────────────────────────────────────────────────────

let ws: WebSocket | null = null;
let shouldReconnect = true;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let lastMessageAt = 0;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// ── URL construction ──────────────────────────────────────────────────────

function buildUrl(): string {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error("ODDS_API_KEY environment variable is not set");
  return `${WS_URL}?apiKey=${apiKey}&markets=${WS_MARKETS}&sport=${WS_SPORTS.join(",")}`;
}

// ── Message handlers ──────────────────────────────────────────────────────

function handleCreated(msg: WsCreatedMessage): void {
  cache.set(
    `odds:${msg.id}:${msg.bookie}`,
    { url: msg.url, markets: msg.markets },
    CACHE_TTL.ODDS_WS,
    "ws",
  );

  emit("event:created", { eventId: msg.id, bookie: msg.bookie });

  const consolidated = cache.getConsolidatedEvent(msg.id);
  if (consolidated) {
    emit("odds:updated", consolidated);
  }
}

function handleUpdated(msg: WsUpdatedMessage): void {
  cache.set(
    `odds:${msg.id}:${msg.bookie}`,
    { url: msg.url, markets: msg.markets },
    CACHE_TTL.ODDS_WS,
    "ws",
  );

  const consolidated = cache.getConsolidatedEvent(msg.id);
  if (consolidated) {
    emit("odds:updated", consolidated);
  }
}

function handleDeleted(msg: { id: string }): void {
  // Deleted messages don't include bookie — remove all bookmaker entries
  const matchingKeys = cache.keys(`odds:${msg.id}:`);
  for (const key of matchingKeys) {
    cache.del(key);
  }

  emit("odds:deleted", { eventId: msg.id, bookie: "all" });
  emit("event:deleted", { eventId: msg.id });
}

function handleMessage(raw: string): void {
  // WS feed may send multiple JSON objects per frame (one per line)
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  for (const line of lines) {
    let msg: WsMessage;
    try {
      msg = JSON.parse(line) as WsMessage;
    } catch {
      console.warn("[ws-client] Failed to parse message:", line.slice(0, 200));
      continue;
    }

    switch (msg.type) {
      case "welcome":
        console.log(
          "[ws-client] Connected — bookmakers:",
          msg.bookmakers.join(", "),
          "| sports:",
          msg.sport_filter.join(", "),
        );
        break;
      case "created":
        handleCreated(msg);
        break;
      case "updated":
        handleUpdated(msg);
        break;
      case "deleted":
        handleDeleted(msg);
        break;
      case "no_markets":
        console.log("[ws-client] No markets for event:", msg.id);
        break;
    }
  }
}

// ── Heartbeat ─────────────────────────────────────────────────────────────

function startHeartbeat(): void {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (lastMessageAt > 0 && Date.now() - lastMessageAt > 60_000) {
      console.warn("[ws-client] No message in 60s — forcing reconnect");
      ws?.close();
    }
  }, 15_000);

  if (typeof heartbeatInterval === "object" && "unref" in heartbeatInterval) {
    heartbeatInterval.unref();
  }
}

function stopHeartbeat(): void {
  if (heartbeatInterval !== null) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ── Reconnection ──────────────────────────────────────────────────────────

function scheduleReconnect(): void {
  if (!shouldReconnect) return;

  const delay = Math.min(1_000 * 2 ** reconnectAttempts, 30_000);
  reconnectAttempts++;

  console.log(
    `[ws-client] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`,
  );

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectWebSocket();
  }, delay);
}

// ── Public API ────────────────────────────────────────────────────────────

export function connectWebSocket(): void {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const url = buildUrl();
  ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("[ws-client] Connection opened");
    reconnectAttempts = 0;
    lastMessageAt = Date.now();
    startHeartbeat();
  });

  ws.on("message", (data: WebSocket.Data) => {
    lastMessageAt = Date.now();
    handleMessage(data.toString());
  });

  ws.on("close", () => {
    console.log("[ws-client] Connection closed");
    stopHeartbeat();
    ws = null;
    scheduleReconnect();
  });

  ws.on("error", (err: Error) => {
    console.error("[ws-client] Error:", err.message);
  });
}

export function disconnectWebSocket(): void {
  shouldReconnect = false;

  if (reconnectTimeout !== null) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  stopHeartbeat();

  if (ws) {
    ws.close();
    ws = null;
  }
}

export function getWSStatus(): {
  connected: boolean;
  reconnectAttempts: number;
  lastMessageAt: number;
} {
  return {
    connected: ws !== null && ws.readyState === WebSocket.OPEN,
    reconnectAttempts,
    lastMessageAt,
  };
}
