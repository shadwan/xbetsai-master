#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Test pipeline — validates the data layer without starting Next.js
// Run: npx tsx scripts/test-pipeline.ts
// ---------------------------------------------------------------------------

// Set API key before any imports that read process.env
process.env.ODDS_API_KEY = "0329515460138b3fe9904d756c5167b08f647c1d4afede36eacb195e76119960";

import { initSSE } from "../src/lib/realtime/sse-manager";
import {
  connectWebSocket,
  disconnectWebSocket,
  getWSStatus,
} from "../src/lib/realtime/ws-client";
import { startPollers, stopPollers } from "../src/lib/realtime/poller";
import * as cache from "../src/lib/cache/store";
import { on } from "../src/lib/realtime/bus";
import { SPORTS } from "../src/lib/odds-api/constants";
import type { BusEvents } from "../src/lib/realtime/bus";

// ── Helpers ─────────────────────────────────────────────────────────────

function log(label: string, value: unknown): void {
  console.log(`[TEST] ${label}:`, value);
}

function divider(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const errors: string[] = [];
  const successes: string[] = [];

  // Check env
  if (!process.env.ODDS_API_KEY) {
    console.error("[TEST] ODDS_API_KEY is not set. Create .env.local with your key.");
    process.exit(1);
  }
  log("API key", `${process.env.ODDS_API_KEY.slice(0, 6)}...`);

  // ── Phase 1: Start everything ───────────────────────────────────────

  divider("Phase 1: Starting services");

  try {
    initSSE();
    log("initSSE", "OK");
    successes.push("initSSE()");
  } catch (err) {
    log("initSSE", `FAILED: ${(err as Error).message}`);
    errors.push(`initSSE: ${(err as Error).message}`);
  }

  try {
    connectWebSocket();
    log("connectWebSocket", "OK");
    successes.push("connectWebSocket()");
  } catch (err) {
    log("connectWebSocket", `FAILED: ${(err as Error).message}`);
    errors.push(`connectWebSocket: ${(err as Error).message}`);
  }

  try {
    console.log("[TEST] Starting pollers (this fetches initial data — may take a while)...");
    await startPollers();
    log("startPollers", "OK");
    successes.push("startPollers()");
  } catch (err) {
    log("startPollers", `FAILED: ${(err as Error).message}`);
    errors.push(`startPollers: ${(err as Error).message}`);
  }

  // Wait for data to populate
  console.log("[TEST] Waiting 15 seconds for data to populate...");
  await sleep(15_000);

  // ── Phase 2: Assertions ─────────────────────────────────────────────

  divider("Phase 2: Cache assertions");

  // Sports
  const sports = cache.get<unknown[]>("sports");
  if (sports) {
    log("cache.get('sports')", `${sports.length} sports`);
    successes.push(`sports: ${sports.length}`);
  } else {
    log("cache.get('sports')", "NULL — no sports cached");
    errors.push("sports cache is null");
  }

  // Cache stats
  const stats = cache.getStats();
  log("cache.getStats()", stats);
  successes.push(`cache: ${stats.size} keys, ${stats.hits} hits, ${stats.misses} misses`);

  // Events per sport
  let firstEventId: string | null = null;
  for (const s of SPORTS) {
    const events = cache.getEventsBySport(s.leagueSlug);
    log(`events:${s.leagueSlug} (${s.displayName})`, `${events.length} events`);
    if (events.length > 0) {
      successes.push(`${s.displayName}: ${events.length} events`);
      if (!firstEventId) {
        firstEventId = events[0].id;
      }
    }
  }

  // Consolidated event
  if (firstEventId) {
    const consolidated = cache.getConsolidatedEvent(firstEventId);
    if (consolidated) {
      const bookieCount = Object.keys(consolidated.bookmakers).length;
      log(
        `getConsolidatedEvent(${firstEventId})`,
        `${bookieCount} bookmakers, lastUpdated: ${new Date(consolidated.lastUpdated).toISOString()}`,
      );
      successes.push(`consolidated event: ${bookieCount} bookmakers`);
    } else {
      log(`getConsolidatedEvent(${firstEventId})`, "NULL — no odds for this event yet");
      errors.push("consolidated event is null");
    }
  } else {
    log("getConsolidatedEvent", "SKIPPED — no events found");
    errors.push("no events found to consolidate");
  }

  // Value bets
  const valueBets = cache.getAllValueBets();
  log("getAllValueBets()", `${valueBets.length} value bets`);
  successes.push(`value bets: ${valueBets.length}`);

  // Arb bets
  const arbBets = cache.get<unknown[]>("arb-bets");
  log("cache.get('arb-bets')", `${arbBets ? arbBets.length : 0} arb bets`);
  successes.push(`arb bets: ${arbBets ? arbBets.length : 0}`);

  // WS status
  const wsStatus = getWSStatus();
  log("getWSStatus()", wsStatus);
  if (wsStatus.connected) {
    successes.push("WS connected");
  } else {
    errors.push("WS not connected");
  }

  // ── Phase 3: Bus event listener ─────────────────────────────────────

  divider("Phase 3: Bus events (listening for 30 seconds)");

  const eventCounts: Record<string, number> = {};

  const handlers: Array<{ event: keyof BusEvents; handler: (p: unknown) => void }> = [];

  for (const eventName of [
    "odds:updated",
    "odds:deleted",
    "valuebets:updated",
    "arbbets:updated",
    "events:updated",
    "event:created",
    "event:deleted",
  ] as const) {
    const handler = (payload: unknown) => {
      eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
      const size = JSON.stringify(payload).length;
      console.log(
        `[BUS] ${eventName} — count: ${eventCounts[eventName]}, payload size: ${size} bytes`,
      );
    };
    on(eventName, handler as (p: BusEvents[typeof eventName]) => void);
    handlers.push({ event: eventName, handler });
  }

  console.log("[TEST] Listening for bus events for 30 seconds...");
  await sleep(30_000);

  // ── Phase 4: Shutdown ───────────────────────────────────────────────

  divider("Phase 4: Shutdown");

  disconnectWebSocket();
  log("disconnectWebSocket", "OK");

  stopPollers();
  log("stopPollers", "OK");

  const finalStats = cache.getStats();
  log("Final cache stats", finalStats);

  // ── Summary ─────────────────────────────────────────────────────────

  divider("Summary");

  console.log("Bus events received:");
  for (const [event, count] of Object.entries(eventCounts)) {
    console.log(`  ${event}: ${count}`);
  }
  if (Object.keys(eventCounts).length === 0) {
    console.log("  (none)");
  }

  console.log("\nSuccesses:");
  for (const s of successes) {
    console.log(`  ✓ ${s}`);
  }

  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const e of errors) {
      console.log(`  ✗ ${e}`);
    }
  } else {
    console.log("\nNo errors!");
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[TEST] Fatal error:", err);
  process.exit(1);
});
