// ---------------------------------------------------------------------------
// Odds-API.io — type declarations
// ---------------------------------------------------------------------------

// ── SDK re-exports (all public types from odds-api-io) ────────────────────

export type {
  Sport,
  League,
  Event,
  Participant,
  Bookmaker,
  MarketOdds,
  EventOdds,
  OddsMovement,
  HistoricalSport,
  HistoricalLeague,
  HistoricalScore,
  HistoricalEvent,
  HistoricalEventOdds,
  HistoricalOddsMarket,
  HistoricalOddsSelection,
  ArbitrageBet,
  ValueBet,
  OddsAPIClientConfig,
  GetEventsParams,
  GetHistoricalEventsParams,
  GetOddsParams,
  GetHistoricalOddsParams,
  GetOddsMovementParams,
  GetMultiEventOddsParams,
  GetUpdatedOddsSinceParams,
  GetParticipantsParams,
  GetArbitrageBetsParams,
  GetValueBetsParams,
} from "odds-api-io";

// ── WebSocket types (match WS guide field names) ─────────────────────────

export interface WsOddsOutcome {
  readonly label?: string;
  readonly home?: string;
  readonly draw?: string;
  readonly away?: string;
  readonly hdp?: number;
  readonly over?: string;
  readonly under?: string;
  readonly max?: number;
}

export interface WsMarket {
  readonly name: string;
  readonly updatedAt: string;
  readonly odds: readonly WsOddsOutcome[];
}

export interface WsWelcomeMessage {
  readonly type: "welcome";
  readonly message: string;
  readonly user_id: string;
  readonly bookmakers: readonly string[];
  readonly sport_filter: readonly string[];
  readonly leagues_filter: readonly string[];
  readonly event_id_filter: readonly string[];
  readonly status_filter: string;
  readonly market_filter: readonly string[];
  readonly connected_at: string;
}

export interface WsCreatedMessage {
  readonly type: "created";
  readonly timestamp: string;
  readonly id: string;
  readonly bookie: string;
  readonly url: string;
  readonly markets: readonly WsMarket[];
}

export interface WsUpdatedMessage {
  readonly type: "updated";
  readonly timestamp: string;
  readonly id: string;
  readonly bookie: string;
  readonly url: string;
  readonly markets: readonly WsMarket[];
}

export interface WsDeletedMessage {
  readonly type: "deleted";
  readonly timestamp: string;
  readonly id: string;
}

export interface WsNoMarketsMessage {
  readonly type: "no_markets";
  readonly timestamp: string;
  readonly id: string;
}

export type WsMessage =
  | WsWelcomeMessage
  | WsCreatedMessage
  | WsUpdatedMessage
  | WsDeletedMessage
  | WsNoMarketsMessage;

// ── Cache types ──────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  readonly data: T;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly hash?: string;
}

export interface CacheStats {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
  readonly wsWrites: number;
  readonly restWrites: number;
  readonly restUnchanged: number;
  readonly pruned: number;
}

// ── App composite types ──────────────────────────────────────────────────

import type { Event } from "odds-api-io";

export interface ConsolidatedOddsEvent {
  readonly event: Event;
  readonly bookmakers: Record<string, { readonly url: string; readonly markets: readonly WsMarket[] }>;
  readonly lastUpdated: number;
}
