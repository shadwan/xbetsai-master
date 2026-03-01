import { TrendingUp } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function LineMovementVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Line Movement — Bills vs Dolphins
        </span>
        <span className="text-xs text-text-tertiary">Spread</span>
      </div>

      {/* Mini chart mock */}
      <div className="relative h-36 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-3 flex flex-col justify-between h-[calc(100%-24px)] text-[10px] text-text-tertiary font-mono">
          <span>-2.5</span>
          <span>-3.0</span>
          <span>-3.5</span>
        </div>

        {/* Chart lines */}
        <svg
          viewBox="0 0 200 80"
          className="ml-6 h-full w-[calc(100%-24px)]"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(255,255,255,0.04)" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.04)" />
          <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.04)" />

          {/* DraftKings line */}
          <polyline
            points="0,20 40,25 80,30 120,15 160,35 200,30"
            fill="none"
            stroke="#F1E185"
            strokeWidth="2"
          />
          {/* FanDuel line */}
          <polyline
            points="0,25 40,30 80,35 120,25 160,40 200,38"
            fill="none"
            stroke="#39ff14"
            strokeWidth="2"
          />
          {/* BetMGM line */}
          <polyline
            points="0,22 40,28 80,32 120,20 160,38 200,35"
            fill="none"
            stroke="#b388ff"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-gold" />
          <span className="text-text-tertiary">DraftKings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-neon-green" />
          <span className="text-text-tertiary">FanDuel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-text-tertiary">BetMGM</span>
        </div>
      </div>
    </div>
  );
}

export function FeaturesLineMovement() {
  return (
    <FeatureSection
      icon={TrendingUp}
      accent="text-neon-cyan"
      bg="bg-neon-cyan/10"
      ring="ring-neon-cyan/20"
      title="Track Every Line Move"
      description="See how odds have shifted over time across every sportsbook. Spot steam moves, reverse line movement, and market inefficiencies before they disappear."
      bullets={[
        "Historical odds charting per bookmaker with color-coded lines",
        "Moneyline, spread, and totals views for every tracked event",
        "Color-coded bookmaker lines make it easy to compare movement",
        "Home/away toggle to focus on the side you care about",
        "Spot steam moves and reverse line movement at a glance",
      ]}
      visual={<LineMovementVisual />}
    />
  );
}
