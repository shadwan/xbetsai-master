import { Trophy } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function ArbitrageVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Surebet Found
        </span>
        <span className="rounded-full bg-neon-yellow/10 px-2.5 py-0.5 text-xs font-bold text-neon-yellow">
          +2.8% Profit
        </span>
      </div>

      <div className="space-y-3">
        {/* Leg 1 */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Leg 1 — DraftKings</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                Yankees ML
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-text-primary">
                +145
              </p>
              <p className="text-xs text-text-tertiary">Stake: $408.16</p>
            </div>
          </div>
        </div>

        {/* Leg 2 */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Leg 2 — FanDuel</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                Red Sox ML
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-text-primary">
                -135
              </p>
              <p className="text-xs text-text-tertiary">Stake: $591.84</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-neon-yellow/20 bg-neon-yellow/[0.05] px-4 py-2.5">
        <span className="text-sm font-medium text-text-primary">
          Guaranteed Profit
        </span>
        <span className="font-mono text-lg font-bold text-neon-yellow">
          $28.00
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" />
        <span>Updated 12s ago</span>
      </div>
    </div>
  );
}

export function FeaturesArbitrage() {
  return (
    <FeatureSection
      icon={Trophy}
      accent="text-neon-yellow"
      bg="bg-neon-yellow/10"
      ring="ring-neon-yellow/20"
      title="Guaranteed Profit, Zero Risk"
      description="Our arbitrage scanner continuously monitors every sportsbook for pricing discrepancies that guarantee a profit regardless of the game outcome."
      bullets={[
        "Cross-book surebet detection runs continuously across all tracked books",
        "Profit % displayed for every opportunity with exact dollar amounts",
        "Interactive stake calculator shows exactly how much to wager on each leg",
        "Step-by-step placement instructions so you never miss a detail",
        "Freshness indicators show how recently odds were verified",
      ]}
      visual={<ArbitrageVisual />}
    />
  );
}
