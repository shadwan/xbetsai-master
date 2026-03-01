import { Users } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function PlayerPropsVisual() {
  const books = [
    { name: "DraftKings", over: "-115", under: "-105", best: "under" },
    { name: "FanDuel", over: "-110", under: "-110", best: "over" },
    { name: "BetMGM", over: "-120", under: "+100", best: "under" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-400/10 text-lg font-bold text-purple-400">
          JT
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Jayson Tatum
          </p>
          <p className="text-xs text-text-tertiary">
            Celtics — Points O/U 28.5
          </p>
        </div>
        <span className="ml-auto rounded-full bg-neon-green/10 px-2.5 py-0.5 text-xs font-semibold text-neon-green">
          Edge
        </span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-text-tertiary">
          <span>Book</span>
          <span className="text-center">Over</span>
          <span className="text-center">Under</span>
        </div>
        {books.map((b) => (
          <div
            key={b.name}
            className="grid grid-cols-3 gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-text-primary">{b.name}</span>
            <span
              className={`text-center font-mono font-semibold ${
                b.best === "over" ? "text-purple-400" : "text-text-secondary"
              }`}
            >
              {b.over}
            </span>
            <span
              className={`text-center font-mono font-semibold ${
                b.best === "under" ? "text-purple-400" : "text-text-secondary"
              }`}
            >
              {b.under}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesPlayerProps() {
  return (
    <FeatureSection
      icon={Users}
      accent="text-purple-400"
      bg="bg-purple-400/10"
      ring="ring-purple-400/20"
      title="Go Deeper with Player-Level Analysis"
      description="Compare player prop lines across every sportsbook, spot edges the market is mispricing, and find the best odds for the props you want to bet."
      bullets={[
        "ESPN roster integration with player headshots and team info",
        "Multi-book prop line comparison for every available player market",
        "Edge detection per player highlights mispriced lines",
        "Over/under odds displayed side-by-side for quick comparison",
        "Supports strikeouts, points, rebounds, assists, and more",
      ]}
      visual={<PlayerPropsVisual />}
      reverse
    />
  );
}
