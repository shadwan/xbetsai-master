import { OddsAPIClient } from "odds-api-io";

export const oddsClient = new OddsAPIClient({ apiKey: process.env.ODDS_API_KEY! });
