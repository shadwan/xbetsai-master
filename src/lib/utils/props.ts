export interface ParsedPropLine {
  playerName: string;
  line: number;
  bookmakerOdds: Record<string, { over: number; under: number }>;
  bestOver: { bookmaker: string; odds: number } | null;
  bestUnder: { bookmaker: string; odds: number } | null;
  lineDiscrepancy: boolean;
}

export interface ParsedPropMarket {
  statType: string;
  lines: ParsedPropLine[];
}

interface RawOddsEntry {
  label: string;
  hdp?: number;
  over?: string;
  under?: string;
}

interface RawMarket {
  name: string;
  odds: RawOddsEntry[];
}

interface RawPropsResponse {
  bookmakers: Record<string, RawMarket[]>;
}

function extractStatType(marketName: string): string {
  // "Player Props - Points" → "Points"
  const match = marketName.match(/Player Props\s*-\s*(.+)/i);
  return match ? match[1].trim() : marketName;
}

/**
 * Transform raw props API response into render-ready structure.
 */
export function parseProps(raw: RawPropsResponse): ParsedPropMarket[] {
  // statType → playerName → bookmaker → { line, over, under }
  const grouped: Record<
    string,
    Record<string, Record<string, { line: number; over: number; under: number }>>
  > = {};

  for (const [bk, markets] of Object.entries(raw.bookmakers)) {
    for (const market of markets) {
      const statType = extractStatType(market.name);

      if (!grouped[statType]) grouped[statType] = {};

      for (const entry of market.odds) {
        const playerName = entry.label;
        if (!playerName) continue;

        if (!grouped[statType][playerName]) grouped[statType][playerName] = {};

        grouped[statType][playerName][bk] = {
          line: entry.hdp ?? 0,
          over: entry.over ? parseFloat(entry.over) : 0,
          under: entry.under ? parseFloat(entry.under) : 0,
        };
      }
    }
  }

  const result: ParsedPropMarket[] = [];

  for (const [statType, players] of Object.entries(grouped)) {
    const lines: ParsedPropLine[] = [];

    for (const [playerName, bookmakers] of Object.entries(players)) {
      const bkEntries = Object.entries(bookmakers);
      if (bkEntries.length === 0) continue;

      // Detect line discrepancy: different hdp values across bookmakers
      const hdpValues = new Set(bkEntries.map(([, v]) => v.line));
      const lineDiscrepancy = hdpValues.size > 1;

      // Use the most common line as the display line
      const line = bkEntries[0][1].line;

      // Build bookmakerOdds record
      const bookmakerOdds: Record<string, { over: number; under: number }> = {};
      let bestOver: { bookmaker: string; odds: number } | null = null;
      let bestUnder: { bookmaker: string; odds: number } | null = null;

      for (const [bk, data] of bkEntries) {
        bookmakerOdds[bk] = { over: data.over, under: data.under };

        if (data.over > 0 && (!bestOver || data.over > bestOver.odds)) {
          bestOver = { bookmaker: bk, odds: data.over };
        }
        if (data.under > 0 && (!bestUnder || data.under > bestUnder.odds)) {
          bestUnder = { bookmaker: bk, odds: data.under };
        }
      }

      lines.push({
        playerName,
        line,
        bookmakerOdds,
        bestOver,
        bestUnder,
        lineDiscrepancy,
      });
    }

    // Sort players alphabetically
    lines.sort((a, b) => a.playerName.localeCompare(b.playerName));

    result.push({ statType, lines });
  }

  // Sort stat types alphabetically
  result.sort((a, b) => a.statType.localeCompare(b.statType));

  return result;
}
