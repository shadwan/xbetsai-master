import { OddsAPIClient } from "odds-api-io";

let _client: OddsAPIClient | null = null;

export const oddsClient: OddsAPIClient = new Proxy({} as OddsAPIClient, {
  get(_target, prop) {
    if (!_client) {
      _client = new OddsAPIClient({ apiKey: process.env.ODDS_API_KEY! });
    }
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
