# xBetsAI — Architecture & Codebase Assessment

## Overview

xBetsAI is a real-time sports betting data aggregation platform built on **Next.js 16** (App Router). It connects to the [Odds-API.io](https://odds-api.io) service via both WebSocket and REST, maintains an in-memory cache of odds/events/bets, and exposes the data through HTTP API routes and a Server-Sent Events (SSE) stream for live browser updates.

No UI has been built yet — the frontend is still the default Next.js scaffold. The entire backend data pipeline is complete and functional.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Turbopack, App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 (not yet used) |
| Data fetching | @tanstack/react-query (installed, not wired) |
| Odds provider | odds-api-io SDK + raw WebSocket |
| Realtime (server) | Node.js EventEmitter bus + SSE |
| Realtime (client) | WebSocket (ws library) |
| Fonts | Geist Sans / Geist Mono |

---

## Directory Structure

```
xbetsai-master/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── page.tsx                    # Home page (default scaffold)
│   └── api/
│       ├── sports/route.ts         # GET /api/sports
│       ├── events/route.ts         # GET /api/events[?sport=]
│       ├── odds/
│       │   ├── route.ts            # GET /api/odds[?sport=]
│       │   └── [eventId]/route.ts  # GET /api/odds/:eventId
│       ├── value-bets/route.ts     # GET /api/value-bets
│       ├── arb-bets/route.ts       # GET /api/arb-bets
│       ├── props/[eventId]/route.ts# GET /api/props/:eventId
│       └── stream/route.ts         # GET /api/stream (SSE)
├── src/
│   └── lib/
│       ├── odds-api/
│       │   ├── client.ts           # Lazy-init SDK singleton (Proxy)
│       │   ├── constants.ts        # Bookmakers, sports, TTLs, intervals
│       │   └── types.ts            # SDK re-exports + WS/cache types
│       ├── cache/
│       │   └── store.ts            # In-memory cache (globalThis singleton)
│       └── realtime/
│           ├── bus.ts              # Typed EventEmitter (globalThis singleton)
│           ├── ws-client.ts        # WebSocket client w/ reconnect
│           ├── poller.ts           # REST polling engine (9 fetchers)
│           └── sse-manager.ts      # SSE bridge (bus → browser clients)
├── scripts/
│   └── test-pipeline.ts           # Standalone integration test
├── instrumentation.ts              # Next.js server startup hook
├── CLAUDE.md                       # Dev instructions
└── package.json
```

---

## Data Flow Diagrams

### High-Level Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Odds-API.io                                 │
│                                                                      │
│  REST (api2.odds-api.io/v3)            WS (api.odds-api.io/v3/ws)   │
│  ┌──────────────────────┐              ┌──────────────────────┐      │
│  │ /sports              │              │ 1 persistent conn    │      │
│  │ /leagues             │              │ Push: created,       │      │
│  │ /events              │              │   updated, deleted   │      │
│  │ /odds/multi          │              │ Filters: ML, Spread, │      │
│  │ /value-bets          │              │   Totals × 4 sports  │      │
│  │ /arbitrage-bets      │              │ 5 bookmakers         │      │
│  │ /participants        │              └──────────┬───────────┘      │
│  │ /odds (props)        │                         │                  │
│  └──────────┬───────────┘                         │                  │
└─────────────┼─────────────────────────────────────┼──────────────────┘
              │                                     │
    Polled every 15-60s                   Continuous push
    (30 req/min steady)                   (0 API quota cost)
              │                                     │
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js Server Process                            │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │     poller.ts     │          │   ws-client.ts    │                │
│  │                   │          │                   │                │
│  │ 9 fetchers:       │          │ Reconnect:        │                │
│  │  sports (1×)      │          │  exp. backoff     │                │
│  │  leagues (1×)     │          │  1s → 30s max     │                │
│  │  events (60s)     │          │                   │                │
│  │  value-bets (15s) │          │ Heartbeat:        │                │
│  │  arb-bets (15s)   │          │  60s timeout      │                │
│  │  odds/multi (1×)  │          │                   │                │
│  │  participants (1×)│          │ Fallback:         │                │
│  │  odds fallback    │◄─────── │  if disconnected, │                │
│  │  props (on-demand)│ trigger  │  poller takes over│                │
│  └────────┬─────────┘          └─────────┬─────────┘                │
│           │                              │                          │
│           │     cache.set()              │  cache.set()             │
│           │     source: "rest"           │  source: "ws"            │
│           ▼                              ▼                          │
│  ┌─────────────────────────────────────────────────┐                │
│  │              cache/store.ts                      │                │
│  │              (globalThis Map)                    │                │
│  │                                                  │                │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐   │                │
│  │  │ sports   │ │ events:  │ │ odds:         │   │                │
│  │  │ leagues: │ │  per     │ │  {eventId}:   │   │                │
│  │  │  per     │ │  league  │ │  {bookmaker}  │   │                │
│  │  │  sport   │ │  slug    │ │  per bookie   │   │                │
│  │  └──────────┘ └──────────┘ └───────────────┘   │                │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐   │                │
│  │  │ value-   │ │ arb-bets │ │ participants: │   │                │
│  │  │ bets:    │ │ (single  │ │  per sport    │   │                │
│  │  │  per     │ │  key)    │ │  slug         │   │                │
│  │  │  bookie  │ │          │ │               │   │                │
│  │  └──────────┘ └──────────┘ └───────────────┘   │                │
│  │                                                  │                │
│  │  Features: TTL expiry, djb2 hash dedup,          │                │
│  │  hit/miss stats, 60s auto-prune                  │                │
│  └──────────────────────┬──────────────────────────┘                │
│                         │                                            │
│              bus.emit() │ (only on data change)                      │
│                         ▼                                            │
│  ┌─────────────────────────────────────────────────┐                │
│  │              bus.ts (EventEmitter)                │                │
│  │              (globalThis singleton)               │                │
│  │                                                   │                │
│  │  Events:                                          │                │
│  │   odds:updated ──────┐                            │                │
│  │   odds:deleted ──────┤                            │                │
│  │   valuebets:updated ─┤                            │                │
│  │   arbbets:updated ───┤                            │                │
│  │   events:updated ────┤                            │                │
│  │   event:created ─────┤                            │                │
│  │   event:deleted ─────┘                            │                │
│  └──────────┬───────────────────┬────────────────────┘              │
│             │                   │                                    │
│             ▼                   ▼                                    │
│  ┌──────────────────┐  ┌──────────────────────┐                    │
│  │  sse-manager.ts   │  │   API Routes (8)     │                    │
│  │  broadcast() to   │  │   Read from cache    │                    │
│  │  all SSE clients  │  │   on each request    │                    │
│  └────────┬─────────┘  └──────────┬───────────┘                    │
└───────────┼────────────────────────┼────────────────────────────────┘
            │                        │
  SSE push  │              HTTP GET  │
  (long-lived)             (stateless)
            ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Browser Clients                                │
│                                                                      │
│  EventSource("/api/stream")        fetch("/api/events?sport=...")    │
│  - odds events (live)              - sports, events, odds            │
│  - valuebets (every ~15s)          - value-bets, arb-bets            │
│  - arbbets (every ~15s)            - props (on-demand)               │
│  - events (on change)                                                │
└──────────────────────────────────────────────────────────────────────┘
```

### Startup Sequence

```
instrumentation.ts register()
        │
        ├──→ initSSE()                     Subscribe bus → SSE broadcast
        │
        ├──→ connectWebSocket()            Open WS to Odds-API
        │
        └──→ startPollers()
              │
              ├── 1. fetchSportsAndLeagues()
              │     ├── getSports()                1 REST call
              │     └── getLeagues() × 4           4 REST calls (per unique sport slug)
              │
              ├── 2. fetchAllEvents()
              │     └── getEvents() × 6            6 REST calls (per league)
              │
              ├── 3. fetchInitialOdds()
              │     └── getOddsForMultipleEvents()  ceil(N/10) REST calls
              │         batched, 10 events/call     (N = live + next 24h events)
              │
              ├── 4. fetchParticipants()
              │     └── getParticipants() × 4      4 REST calls (per unique sport slug)
              │
              └── 5. Start recurring timers:
                    ├── pollEvents        → setInterval(60s)
                    ├── pollValueBets     → setInterval(15s)
                    ├── pollArbBets       → setInterval(15s)
                    ├── wsFallbackChecker → setInterval(10s)  [monitor only]
                    ├── sportRecheck      → setInterval(30min)
                    ├── participantRefresh→ setInterval(24h)
                    └── statsLogger       → setInterval(5min) [no API calls]
```

### Cache Write Sources

```
                    Who writes what to cache?

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   poller (REST)                 ws-client (WebSocket)    │
  │   ─────────────                 ─────────────────────    │
  │                                                          │
  │   sports            ◄────       (not via WS)             │
  │   leagues:{slug}    ◄────       (not via WS)             │
  │   events:{league}   ◄────       (not via WS)             │
  │   value-bets:{bk}   ◄────       (not via WS)             │
  │   arb-bets          ◄────       (not via WS)             │
  │   participants:{s}  ◄────       (not via WS)             │
  │   props:{eventId}   ◄────       (not via WS)             │
  │                                                          │
  │   odds:{id}:{bk}    ◄────  ──►  odds:{id}:{bk}          │
  │   (REST fallback +           (live WS push, 30s TTL)     │
  │    initial snapshot,                                     │
  │    5min TTL)                                             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  The odds cache key is the ONLY one written by both sources.
  WS writes use source:"ws", REST writes use source:"rest".
  Stats track these separately for observability.
```

### WS Fallback Decision Flow

```
  Every 10 seconds:

  ┌─────────────────┐
  │ getWSStatus()   │
  │ connected?      │
  └────────┬────────┘
           │
     ┌─────┴─────┐
     │           │
    YES          NO
     │           │
     ▼           ▼
  ┌──────┐   ┌──────────────────────────────┐
  │ Was  │   │ Was fallback already active?  │
  │ fall │   └──────────┬───────────────────┘
  │ back │         ┌────┴────┐
  │ on?  │        NO        YES
  │      │         │         │
  └──┬───┘         ▼         ▼
    YES      ┌──────────┐  (keep running)
     │       │ ACTIVATE  │
     ▼       │ Start     │
  ┌──────┐   │ polling   │
  │DEACT.│   │ every 30s │
  │Stop  │   └───────────┘
  │polls │
  └──────┘

  Fallback polls: getOddsForMultipleEvents() for all live events
  Batched in groups of 10, 1s gap between batches
```

---

## API Request Budget Analysis

**Plan limit: 5,000 requests/hour**

### Request Counting

| Operation | Calls per cycle | Frequency | Calls/hour |
|---|---|---|---|
| **Events poll** | 6 (one per league) | Every 60s | **360** |
| **Value bets poll** | 5 (one per bookmaker) | Every 15s | **1,200** |
| **Arb bets poll** | 1 | Every 15s | **240** |
| **Sport recheck** | 6 | Every 30min | **12** |
| **Participants** | 4 | Every 24h | **~0** |
| **Stats logger** | 0 (no API call) | Every 5min | **0** |
| **Subtotal (fixed)** | | | **1,812** |

Plus variable costs:

| Operation | Calls | When | Typical/hour |
|---|---|---|---|
| **Startup (one-time)** | 15 + ceil(N/10) | Server boot | **~25** |
| **New event odds** | ceil(N/10) | When new events enter 24h window | **~10-50** |
| **WS fallback** | ceil(live/10) | Every 30s, only when WS down | **0 or 120-600** |
| **Props (on-demand)** | 1 per user request | User clicks event detail | **varies** |

### Scenario Breakdown

```
SCENARIO 1: Normal Operation (WS connected, no props)
─────────────────────────────────────────────────────
  Events poll:       360/hr
  Value bets poll: 1,200/hr
  Arb bets poll:     240/hr
  Sport recheck:      12/hr
  ─────────────────────────
  TOTAL:           1,812/hr   ← 36% of 5,000 budget
                               2,188 requests HEADROOM


SCENARIO 2: WS Disconnected (fallback active, 50 live events)
──────────────────────────────────────────────────────────────
  Base:            1,812/hr
  WS fallback:       600/hr   (5 batches × 120 cycles)
  ─────────────────────────
  TOTAL:           2,412/hr   ← 48% of 5,000 budget


SCENARIO 3: Peak Load (WS down, 100 live events, props traffic)
───────────────────────────────────────────────────────────────
  Base:            1,812/hr
  WS fallback:     1,200/hr   (10 batches × 120 cycles)
  Props:             500/hr   (500 user-triggered requests)
  ─────────────────────────
  TOTAL:           3,512/hr   ← 70% of 5,000 budget


SCENARIO 4: Absolute Worst Case
────────────────────────────────
  Base:            1,812/hr
  WS fallback:     2,400/hr   (200 live events, WS down all hour)
  Props:           1,000/hr   (heavy user traffic)
  ─────────────────────────
  TOTAL:           5,212/hr   ← OVER BUDGET by 4%
```

### Per-Cycle Breakdown (Visual)

```
  Every 15 seconds, this happens:
  ───────────────────────────────

  t=0s    ┌─ pollValueBets() starts
          │   FanDuel       → 1 API call
          │   (3s sleep)
          │   BetMGM        → 1 API call
          │   (3s sleep)
          │   Bet365         → 1 API call
          │   (3s sleep)
          │   Caesars        → 1 API call
          │   (3s sleep)
          │   DraftKings     → 1 API call
          └─ total: 5 calls over ~12 seconds

  t=0s    ┌─ pollArbBets()
          │   1 API call
          └─ done

  Every 60 seconds, additionally:
  ────────────────────────────────

  t=0s    ┌─ pollEvents() starts
          │   NFL     → 1 call  (then sleep 10s)
          │   NBA     → 1 call  (then sleep 10s)
          │   MLB     → 1 call  (then sleep 10s)
          │   NHL     → 1 call  (then sleep 10s)
          │   NCAAF   → 1 call  (then sleep 10s)
          │   NCAAMB  → 1 call
          └─ total: 6 calls staggered over ~50 seconds
```

---

## Scalability Assessment: 1,000 Concurrent Users

### What Scales Automatically (No Extra API Cost)

The current architecture already separates **data ingestion** (Odds-API calls) from **data serving** (user requests). This is the key insight:

```
  Odds-API.io                    xBetsAI Server              Users
  ────────────                   ──────────────              ─────

  Fixed cost:                    ┌──────────────┐
  1,812 req/hr                   │              │
  regardless of   ────────────►  │    Cache     │  ────────►  1 user
  user count                     │   (Map)      │  ────────►  10 users
                                 │              │  ────────►  100 users
  WS: 1 connection               │              │  ────────►  1,000 users
  (free, unlimited)              └──────────────┘

  API cost does NOT increase       User requests read
  when users increase.             from in-memory cache.
                                   Response time: <5ms.
```

**These operations cost ZERO additional API requests per user:**

| What users do | How it's served | API cost |
|---|---|---|
| Load sports list | `cache.get("sports")` | 0 |
| Browse events | `cache.getEventsBySport()` | 0 |
| View odds for an event | `cache.getConsolidatedEvent()` | 0 |
| View all odds for a league | `cache.getAllConsolidatedEvents()` | 0 |
| View value bets | `cache.getAllValueBets()` | 0 |
| View arb bets | `cache.get("arb-bets")` | 0 |
| SSE live stream | bus → SSE broadcast | 0 |

**Only this costs additional API requests:**

| What users do | API cost | With 1,000 users |
|---|---|---|
| View props for an event | 1 call (then cached 30s) | ~100-300/hr (deduplicated by cache) |

### SSE Connection Scaling

```
  1,000 users connected to /api/stream:

  ┌──────────┐         ┌──────────────────────────┐
  │  bus     │ 1 event │  sse-manager.ts           │
  │  emits   │────────►│                           │
  │  "odds:  │         │  for (client of clients)  │   1,000 controller.enqueue()
  │  updated"│         │    controller.enqueue()   │──────────────────────────────►
  │          │         │                           │   calls per bus event
  └──────────┘         └──────────────────────────┘

  Bus events per minute (typical):
    - odds:updated     ~10-50/min (during live games)
    - valuebets:updated ~4/min
    - arbbets:updated   ~4/min
    - events:updated    ~1/min (only on change)

  Total broadcasts: ~20-60 events/min
  Each broadcast: 1,000 enqueue() calls
  Total enqueue ops: 20,000 - 60,000/min

  Each enqueue is ~1-50KB of JSON serialized once, then
  the same Uint8Array is pushed to each controller.
  This is CPU-bound, not I/O-bound.
```

### Memory Scaling

```
  Cache size (fixed, independent of users):
  ──────────────────────────────────────────

  sports:                ~5 KB     (34 sports)
  leagues (×4):          ~50 KB    (200+ leagues)
  events (×6):           ~2 MB     (2,800+ events)
  odds (×events×bookies):~5-20 MB  (varies by live events)
  value-bets (×5):       ~500 KB   (300+ bets × 5 bookmakers)
  arb-bets:              ~10 KB    (typically 0-10)
  participants (×4):     ~2 MB     (5,000+ participants)
  ──────────────────────────────────────────
  TOTAL CACHE:           ~10-25 MB


  Per-SSE-client overhead:
  ────────────────────────
  ReadableStreamDefaultController: ~1 KB each
  Set<controller> entry:           ~64 bytes

  1,000 SSE clients: ~1 MB overhead


  TOTAL SERVER MEMORY (1,000 users):
  ──────────────────────────────────
  Node.js base:      ~50 MB
  Cache:             ~25 MB
  SSE controllers:   ~1 MB
  WS client:         ~1 MB
  Event bus:         ~1 MB
  ──────────────────────────────────
  TOTAL:             ~80 MB          ← easily fits on a 512MB instance
```

### Bottleneck Analysis

```
  BOTTLENECK RANKING (most likely to hit first):

  1. SSE CONNECTIONS                          ⚠ Medium Risk at 1,000
     ──────────────
     Node.js default: ~1,000 concurrent connections per process.
     Each SSE is a long-lived HTTP connection held open.
     OS file descriptor limit may need tuning (ulimit -n).

     Fix: Increase ulimit to 4096+, or use worker threads.


  2. SSE BROADCAST CPU                        ✅ Low Risk at 1,000
     ──────────────────
     1,000 enqueue() calls per bus event.
     ~60 events/min during peak = 60,000 enqueue/min.
     Each call is O(1) — just pushing a pre-encoded buffer.

     Would become an issue at ~10,000+ users.


  3. ODDS-API RATE LIMIT                      ✅ Low Risk
     ─────────────────────
     1,812 req/hr base. 5,000 budget.
     Users do NOT add API requests (cache-served).
     Only props add ~100-300/hr with 1,000 users.

     Total: ~2,100/hr = 42% of budget.


  4. CACHE READ CONTENTION                    ✅ No Risk
     ────────────────────────
     In-memory Map reads are O(1) and synchronous.
     Node.js is single-threaded — no lock contention.
     1,000 concurrent reads: <1ms each.


  5. MEMORY                                   ✅ No Risk at 1,000
     ──────
     ~80 MB total. Would need 10,000+ users to matter.
```

### Scaling Recommendations

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    CURRENT ARCHITECTURE                      │
  │                                                             │
  │  Single Node.js process                                     │
  │  In-memory cache (Map)                                      │
  │  Single WS connection                                       │
  │  SSE broadcast to all clients                               │
  │                                                             │
  │  Handles: 1,000 users comfortably                           │
  │  API budget: 36-42% utilized                                │
  │  Memory: ~80 MB                                             │
  └─────────────────────────────────────────────────────────────┘

  For 1,000 users, NO changes needed. Here's what to watch:

  ┌─────────────────────────────────────────────────────────────┐
  │ IF SCALING BEYOND 1,000 USERS:                              │
  │                                                             │
  │ 1. Props endpoint — add request deduplication               │
  │    Multiple users requesting same event props               │
  │    within 30s should share one API call.                    │
  │    Currently: cache handles this (30s TTL).                 │
  │    Risk: thundering herd on cache miss.                     │
  │    Fix: Add a promise-based dedup layer:                    │
  │         const pending = new Map<string, Promise>()          │
  │                                                             │
  │ 2. SSE connections — add connection limits                  │
  │    At 5,000+ users, file descriptors and memory             │
  │    become concerns.                                         │
  │    Fix: Switch to polling (React Query 30s refetch)         │
  │    or add a WebSocket fan-out layer (Socket.io/ws).         │
  │                                                             │
  │ 3. Multi-process — run N workers behind a load balancer     │
  │    Each worker runs its own cache + pollers.                │
  │    Problem: N workers × 1,812 req/hr = N × API cost.       │
  │    Fix: Extract poller into a single "ingest" process,      │
  │    share cache via Redis, workers just serve.               │
  │                                                             │
  │ 4. Value bets poll — biggest API consumer                   │
  │    1,200/hr = 67% of base API budget.                       │
  │    Fix: Reduce to 3 bookmakers (720/hr),                    │
  │    or increase interval to 30s (600/hr).                    │
  └─────────────────────────────────────────────────────────────┘
```

### API Budget Optimization Levers

```
  Current baseline: 1,812 req/hr (36% of 5,000)

  ┌──────────────────────────────────────────────────────────────┐
  │  Lever                      │ Savings    │ New Total         │
  │─────────────────────────────┼────────────┼───────────────────│
  │ Value bets → 30s interval   │ -600/hr    │ 1,212/hr (24%)   │
  │ Value bets → 3 bookmakers   │ -480/hr    │ 1,332/hr (27%)   │
  │ Events poll → 120s interval │ -180/hr    │ 1,632/hr (33%)   │
  │ Arb bets → 30s interval     │ -120/hr    │ 1,692/hr (34%)   │
  │ All of the above combined   │ -1,380/hr  │   432/hr (9%)    │
  └──────────────────────────────────────────────────────────────┘

  Most aggressive optimization frees up 4,568 req/hr
  for props, fallback, and growth.
```

---

## Module Breakdown

### 1. Startup — `instrumentation.ts`

Next.js calls `register()` once when the Node.js server starts. It:

1. Initializes the SSE bridge (subscribes bus → SSE broadcast)
2. Opens the WebSocket connection to Odds-API
3. Starts all REST pollers (sequential: sports → events → odds → participants → recurring timers)
4. Registers SIGTERM/SIGINT handlers for graceful shutdown

This is the only orchestration point — everything else is modular and event-driven.

### 2. Odds-API Client — `src/lib/odds-api/client.ts`

A **Proxy-wrapped lazy singleton**. The `OddsAPIClient` from the SDK is not instantiated until the first method call. This solves an ES module hoisting issue where `process.env.ODDS_API_KEY` would be `undefined` at import time in standalone scripts.

### 3. Constants — `src/lib/odds-api/constants.ts`

Central configuration for the entire pipeline:

- **6 sports**: NFL, NBA, MLB, NHL, NCAAF, NCAAMB
- **5 bookmakers**: FanDuel, BetMGM, Bet365, Caesars, DraftKings
- **WS filters**: ML, Spread, Totals across 4 sport slugs
- **Cache TTLs**: 2h (sports/leagues), 5min (events/REST odds), 30s (WS odds), 10s (value/arb bets)
- **Poll intervals**: 60s (events), 15s (value bets, arb bets)

### 4. Types — `src/lib/odds-api/types.ts`

Re-exports all SDK types plus custom types for:
- WebSocket message variants (welcome, created, updated, deleted, no_markets)
- Cache entries with TTL and hash
- `ConsolidatedOddsEvent` — an event merged with all bookmaker odds

### 5. Cache Store — `src/lib/cache/store.ts`

An in-memory `Map<string, CacheEntry>` stored on `globalThis` to survive Turbopack module re-bundling in dev mode. Key features:

| Feature | Detail |
|---|---|
| TTL expiration | Entries expire based on configurable TTL per data type |
| Hash-based dedup | `setIfChanged()` uses djb2 hash to skip writes when data hasn't changed |
| Source tracking | Tracks whether writes come from WS or REST for observability |
| Periodic pruning | Every 60s, expired entries are cleaned up |
| Stats | Hit/miss counters, write counters by source, prune count |

**Key patterns (cache key → data type):**
```
sports                           → Sport[]
leagues:{sportSlug}              → League[]
events:{leagueSlug}              → Event[]
odds:{eventId}:{bookmaker}       → { url, markets: WsMarket[] }
value-bets:{bookmaker}           → ValueBet[]
arb-bets                         → ArbitrageBet[]
props:{eventId}                  → EventOdds
participants:{sportSlug}         → Participant[]
```

**Consolidation helpers:**
- `getConsolidatedEvent(id)` — finds the event across all sports caches, gathers all `odds:{id}:*` entries, returns a merged object
- `getAllValueBets()` — merges all per-bookmaker value bets, deduplicates, sorts by value %
- `getAllConsolidatedEvents(league)` — returns all events for a league with their odds attached

### 6. Event Bus — `src/lib/realtime/bus.ts`

A typed `EventEmitter` singleton on `globalThis`. Seven event types:

| Event | Payload | Emitted by |
|---|---|---|
| `odds:updated` | ConsolidatedOddsEvent | ws-client, poller |
| `odds:deleted` | { eventId, bookie } | ws-client |
| `valuebets:updated` | ValueBet[] | poller |
| `arbbets:updated` | ArbitrageBet[] | poller |
| `events:updated` | { leagueSlug, events } | poller |
| `event:created` | { eventId, bookie } | ws-client |
| `event:deleted` | { eventId } | ws-client |

### 7. WebSocket Client — `src/lib/realtime/ws-client.ts`

Connects to `wss://api.odds-api.io/v3/ws` with API key, market, and sport filters. Handles:

- **created/updated** messages → writes per-bookmaker odds to cache, emits `odds:updated`
- **deleted** messages → removes all bookmaker entries for that event
- **Reconnection** → exponential backoff (1s → 2s → 4s → ... → 30s max)
- **Heartbeat** → if no message for 60s, forces reconnect

### 8. REST Pollers — `src/lib/realtime/poller.ts`

The largest module (575 lines). Runs 9 data-fetching operations:

| # | Fetcher | Schedule | What it does |
|---|---|---|---|
| 1 | `fetchSportsAndLeagues` | Startup only | Fetches all sports + leagues per sport slug |
| 2 | `fetchAllEvents` | Startup + 30min | Fetches events for all 6 leagues, detects active sports |
| 3 | `fetchInitialOdds` | Startup + on new events | Batched multi-event odds fetch (groups of 10) |
| 4 | `fetchParticipants` | Startup + 24h | Team/player data for active sports |
| 5 | `pollEvents` | Every 60s | Staggered per-sport event refresh, triggers odds fetch for new events |
| 6 | `pollValueBets` | Every 15s | Per-bookmaker value bet fetch (staggered with 3s gaps) |
| 7 | `pollArbBets` | Every 15s | Single arbitrage bets call |
| 8 | `pollOddsFallback` | Every 30s (only when WS down) | REST-based odds polling as WS backup |
| 9 | `fetchPropsForEvent` | On-demand | Cache-first props fetch for a single event |

**Notable design choices:**
- `setIfChanged()` prevents unnecessary bus emissions when polled data hasn't changed
- WS fallback activates/deactivates automatically based on `getWSStatus()`
- New events discovered during polling automatically trigger odds fetches
- Multi-event odds response handling accounts for the actual API shape (differs from SDK types)

### 9. SSE Manager — `src/lib/realtime/sse-manager.ts`

Bridges the server-side bus to browser clients:

1. `initSSE()` subscribes to 4 bus events (odds, events, valuebets, arbbets)
2. Each bus event triggers `broadcast()` which encodes as SSE format and enqueues to all connected `ReadableStreamDefaultController`s
3. Dead controllers (closed connections) are auto-cleaned on enqueue failure

### 10. API Routes

All routes are `force-dynamic` (no caching at the Next.js layer). They read directly from the cache store:

| Route | Method | Response |
|---|---|---|
| `/api/sports` | GET | All sports from Odds-API |
| `/api/events` | GET | Events grouped by league (or filtered by `?sport=`) |
| `/api/odds` | GET | Consolidated events with bookmaker odds |
| `/api/odds/:eventId` | GET | Single event's consolidated odds |
| `/api/value-bets` | GET | All value bets (sorted by value %) |
| `/api/arb-bets` | GET | All arbitrage opportunities |
| `/api/props/:eventId` | GET | On-demand props (fetches if not cached) |
| `/api/stream` | GET | SSE stream (long-lived connection) |

---

## Known Issues & Considerations

### API Response vs SDK Types

The `odds-api-io` SDK types don't match the actual API responses in several places:

- **Event.startTime** → API returns `date`
- **Event.status** → API returns `"pending"` / `"settled"`, SDK expects `"upcoming"` / `"finished"`
- **Event.id** → API returns `number`, SDK types say `string`
- **getOddsForMultipleEvents** → Returns event-like objects with `{ bookmakers: { Bet365: WsMarket[] } }` instead of the SDK's `EventOdds` shape with `{ markets: MarketOdds[] }`

These mismatches are handled with runtime checks and type coercion in `poller.ts` and `store.ts`.

### Turbopack Module Isolation

In dev mode, Turbopack can create separate module instances for instrumentation vs API route handlers. Both `cache/store.ts` and `realtime/bus.ts` use `globalThis` to ensure a single shared instance. This has no impact in production where modules are bundled once.

### Off-Season Sports

NFL (Sep-Feb), NCAAF (Aug-Jan), and NCAAMB (Nov-Apr) return 0 events when out of season. The system handles this gracefully — `activeSports` set only includes leagues with > 0 events.

### WS Data Availability

The WebSocket feed only pushes data when odds are actively changing (typically during live games). Outside of game times, the WS connects but sends no created/updated messages. The REST poller provides the initial odds snapshot and the WS fallback covers periods of disconnection.

### Rate Limiting

The poller staggers API calls to avoid rate limits:
- Events: staggered across sports within the 60s interval
- Value bets: 3s gap between bookmaker calls
- Multi-event odds: batched in groups of 10 with 1s gaps

---

## What's Built vs What's Left

### Built (Backend Pipeline)
- Complete data ingestion pipeline (WS + REST)
- In-memory cache with TTL, dedup, and consolidation
- Event bus for internal pub/sub
- SSE streaming to browser clients
- 8 API endpoints serving all data types
- Integration test script
- Graceful startup/shutdown

### Not Built Yet (Frontend)
- No custom UI (still default Next.js scaffold)
- React Query not wired up
- No SSE client hook
- No odds comparison views
- No value bet / arb bet dashboards
- No event detail pages
- No user preferences or filters

---

## File Stats

| File | Lines | Purpose |
|---|---|---|
| `poller.ts` | 575 | REST polling engine |
| `store.ts` | 248 | In-memory cache |
| `test-pipeline.ts` | 234 | Integration test |
| `ws-client.ts` | 218 | WebSocket client |
| `types.ts` | 134 | Type definitions |
| `constants.ts` | 80 | Configuration |
| `sse-manager.ts` | 75 | SSE bridge |
| `bus.ts` | 54 | Event bus |
| `instrumentation.ts` | 29 | Startup orchestration |
| API routes (8 files) | ~130 | HTTP endpoints |
| `client.ts` | 12 | SDK singleton |
| **Total** | **~1,800** | |
