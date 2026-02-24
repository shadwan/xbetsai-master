// ---------------------------------------------------------------------------
// Odds-API.io — type declarations (pure types, no runtime code)
// ---------------------------------------------------------------------------

// ── REST: Core reference types ──────────────────────────────────────────────

export interface Sport {
  readonly name: string;
  readonly slug: string;
}

export interface League {
  readonly name: string;
  readonly slug: string;
  readonly eventsCount: number;
}

export interface Bookmaker {
  readonly name: string;
  readonly active: boolean;
}

export interface SportRef {
  readonly name: string;
  readonly slug: string;
}

export interface LeagueRef {
  readonly name: string;
  readonly slug: string;
}

export interface Scores {
  readonly home: number;
  readonly away: number;
}

// ── REST: Events ────────────────────────────────────────────────────────────

export interface OddsEvent {
  readonly id: number;
  readonly home: string;
  readonly away: string;
  readonly homeId: number;
  readonly awayId: number;
  readonly date: string;
  readonly status: string;
  readonly sport: SportRef;
  readonly league: LeagueRef;
  readonly scores: Scores;
}

// ── REST: Odds ──────────────────────────────────────────────────────────────

export interface OddsOutcome {
  readonly label?: string;
  readonly home?: string;
  readonly away?: string;
  readonly draw?: string;
  readonly over?: string;
  readonly under?: string;
  readonly yes?: string;
  readonly no?: string;
  readonly hdp?: number;
  readonly max?: number;
  // Lay odds
  readonly layHome?: string;
  readonly layAway?: string;
  readonly layDraw?: string;
  readonly layOver?: string;
  readonly layUnder?: string;
  readonly layYes?: string;
  readonly layNo?: string;
  // Dynamic deep-link fields
  readonly [key: `${string}Link`]: string | undefined;
}

export interface Market {
  readonly name: string;
  readonly updatedAt: string;
  readonly odds: readonly OddsOutcome[];
}

export type BookmakerOdds = Record<string, readonly Market[]>;

export interface OddsResponse {
  readonly id: number;
  readonly home: string;
  readonly away: string;
  readonly date: string;
  readonly status: string;
  readonly sport: SportRef;
  readonly league: LeagueRef;
  readonly urls: Record<string, string>;
  readonly bookmakers: BookmakerOdds;
}

// ── REST: Value Bets ────────────────────────────────────────────────────────

export interface ValueBetBookmakerOdds {
  readonly home?: string;
  readonly away?: string;
  readonly draw?: string;
  readonly hdp?: string;
  readonly href: string;
  readonly homeDirectLink?: string;
  readonly awayDirectLink?: string;
  readonly drawDirectLink?: string;
}

export interface ValueBetEvent {
  readonly sport: string;
  readonly league: string;
  readonly home: string;
  readonly away: string;
  readonly date: string;
}

export interface ValueBetMarket {
  readonly name: string;
  readonly home?: string;
  readonly away?: string;
  readonly draw?: string;
  readonly hdp?: number;
  readonly max?: number;
}

export interface ValueBet {
  readonly id: string;
  readonly eventId: number;
  readonly bookmaker: string;
  readonly betSide: string;
  readonly expectedValue: number;
  readonly expectedValueUpdatedAt: string;
  readonly bookmakerOdds: ValueBetBookmakerOdds;
  readonly event: ValueBetEvent;
  readonly market: ValueBetMarket;
}

// ── REST: Arbitrage Bets ────────────────────────────────────────────────────

export interface ArbLeg {
  readonly side: string;
  readonly bookmaker: string;
  readonly odds: string;
  readonly directLink: string;
}

export interface ArbOptimalStake {
  readonly bookmaker: string;
  readonly stake: number;
  readonly potentialReturn: number;
}

export interface ArbMarket {
  readonly name: string;
  readonly handicap: number | null;
}

export interface ArbEvent {
  readonly id: number;
  readonly home: string;
  readonly away: string;
  readonly date: string;
  readonly sport: SportRef;
  readonly league: LeagueRef;
}

// TODO: verify ArbBet against real API response — docs are sparse on this endpoint
export interface ArbBet {
  readonly id: string;
  readonly eventId: number;
  readonly profitMargin: number;
  readonly impliedProbability: number;
  readonly legs: readonly ArbLeg[];
  readonly optimalStakes: readonly ArbOptimalStake[];
  readonly market: ArbMarket;
  readonly event: ArbEvent;
}

// ── REST: Participants ──────────────────────────────────────────────────────

export interface Participant {
  readonly id: number;
  readonly name: string;
  readonly sport: string;
}

// ── REST: Odds Movements ────────────────────────────────────────────────────

export interface OddsMovementPoint {
  readonly home: number;
  readonly draw: number;
  readonly away: number;
  readonly timestamp: number;
}

export interface OddsMovement {
  readonly bookmaker: string;
  readonly eventid: string;
  readonly opening: OddsMovementPoint;
  readonly latest: OddsMovementPoint;
  readonly movements: readonly OddsMovementPoint[];
}

// ── WebSocket ───────────────────────────────────────────────────────────────

export interface WsOddsOutcome {
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

// ── Cache & App types ───────────────────────────────────────────────────────

export interface CacheEntry<T> {
  readonly data: T;
  readonly cachedAt: number;
  readonly expiresAt: number;
  readonly hash?: string;
}

export interface CacheStats {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
  readonly writes: number;
  readonly pruneCount: number;
}

/**
 * Internal assembled shape for the odds grid UI.
 * Uses WsMarket[] because the primary data source is WS messages.
 * REST-polled odds are normalized to the same shape when stored.
 */
export interface ConsolidatedOddsEvent {
  readonly event: OddsEvent;
  readonly bookmakers: Record<string, { readonly url: string; readonly markets: readonly WsMarket[] }>;
  readonly lastUpdated: number;
}
