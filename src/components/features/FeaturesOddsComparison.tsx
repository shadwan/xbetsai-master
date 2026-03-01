import { BarChart3 } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function OddsTableVisual() {
  const books = [
    { name: "DraftKings", home: "+150", away: "-180", best: true },
    { name: "FanDuel", home: "+140", away: "-170", best: false },
    { name: "BetMGM", home: "+145", away: "-175", best: false },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Lakers vs Celtics — Moneyline
        </span>
        <span className="rounded-full bg-neon-green/10 px-2.5 py-0.5 text-xs font-semibold text-neon-green">
          Live
        </span>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-text-tertiary">
          <span>Sportsbook</span>
          <span className="text-center">Lakers</span>
          <span className="text-center">Celtics</span>
        </div>
        {books.map((b) => (
          <div
            key={b.name}
            className="grid grid-cols-3 gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-text-primary">{b.name}</span>
            <span
              className={`text-center font-mono font-semibold ${
                b.best ? "text-neon-gold" : "text-text-secondary"
              }`}
            >
              {b.home}
              {b.best && (
                <span className="ml-1 text-[10px] text-neon-gold">★</span>
              )}
            </span>
            <span className="text-center font-mono font-semibold text-text-secondary">
              {b.away}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
        <div className="h-1.5 w-1.5 rounded-full bg-neon-gold" />
        <span>Best price highlighted</span>
      </div>
    </div>
  );
}

export function FeaturesOddsComparison() {
  return (
    <FeatureSection
      icon={BarChart3}
      accent="text-neon-gold"
      bg="bg-neon-gold/10"
      ring="ring-neon-gold/20"
      title="Compare Every Line, Instantly"
      description="See odds from every major sportsbook side-by-side, with the best price highlighted automatically. Never leave money on the table by betting at the wrong book."
      bullets={[
        "5-book comparison across DraftKings, FanDuel, BetMGM, Caesars, and Bet365",
        "Best price highlighting so you always get the most favorable odds",
        "Outlier detection flags lines that deviate from the market consensus",
        "Consensus probability bar shows the true implied chance of each outcome",
        "Direct bookmaker links to place your bet with one click",
      ]}
      visual={<OddsTableVisual />}
    />
  );
}
