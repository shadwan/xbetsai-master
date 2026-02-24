// ---------------------------------------------------------------------------
// SSE manager — bridges bus events to connected browser clients
// ---------------------------------------------------------------------------

import { on, off } from "@/src/lib/realtime/bus";
import type { BusEvents } from "@/src/lib/realtime/bus";

// ── Module state ──────────────────────────────────────────────────────────

const clients = new Set<ReadableStreamDefaultController>();
const encoder = new TextEncoder();

let oddsHandler: ((p: BusEvents["odds:updated"]) => void) | null = null;
let eventsHandler: ((p: BusEvents["events:updated"]) => void) | null = null;
let valuebetsHandler: ((p: BusEvents["valuebets:updated"]) => void) | null = null;
let arbbetsHandler: ((p: BusEvents["arbbets:updated"]) => void) | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────

function broadcast(eventName: string, data: unknown): void {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);

  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch {
      clients.delete(controller);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export function initSSE(): void {
  if (oddsHandler) return; // already initialized

  oddsHandler = (payload) => broadcast("odds", payload);
  eventsHandler = (payload) => broadcast("events", payload);
  valuebetsHandler = (payload) => broadcast("valuebets", payload);
  arbbetsHandler = (payload) => broadcast("arbbets", payload);

  on("odds:updated", oddsHandler);
  on("events:updated", eventsHandler);
  on("valuebets:updated", valuebetsHandler);
  on("arbbets:updated", arbbetsHandler);
}

export function addClient(controller: ReadableStreamDefaultController): () => void {
  clients.add(controller);
  return () => clients.delete(controller);
}

export function removeClient(controller: ReadableStreamDefaultController): void {
  clients.delete(controller);
}

export function getClientCount(): number {
  return clients.size;
}

export function shutdownSSE(): void {
  if (oddsHandler) off("odds:updated", oddsHandler);
  if (eventsHandler) off("events:updated", eventsHandler);
  if (valuebetsHandler) off("valuebets:updated", valuebetsHandler);
  if (arbbetsHandler) off("arbbets:updated", arbbetsHandler);

  oddsHandler = null;
  eventsHandler = null;
  valuebetsHandler = null;
  arbbetsHandler = null;

  clients.clear();
}
