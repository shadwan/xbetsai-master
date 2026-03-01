import { Zap } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function EVCardVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          +EV Opportunity
        </span>
        <span className="rounded-full bg-neon-green/10 px-2.5 py-0.5 text-xs font-bold text-neon-green">
          +5.2% EV
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-text-primary">
          Chiefs ML vs Ravens
        </p>
        <p className="mt-1 text-xs text-text-tertiary">NFL — Sunday 1:00 PM</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-tertiary">Book Odds</p>
            <p className="mt-1 font-mono text-lg font-bold text-text-primary">
              +155
            </p>
            <p className="text-xs text-text-tertiary">DraftKings</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Fair Odds</p>
            <p className="mt-1 font-mono text-lg font-bold text-neon-green">
              +138
            </p>
            <p className="text-xs text-text-tertiary">Market consensus</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">¼ Kelly Stake</span>
            <span className="font-mono font-semibold text-neon-gold">
              $25.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesEVDetection() {
  return (
    <FeatureSection
      icon={Zap}
      accent="text-neon-green"
      bg="bg-neon-green/10"
      ring="ring-neon-green/20"
      title="Spot Positive Expected Value in Seconds"
      description="Our engine calculates fair odds from multi-book consensus and surfaces bets where the sportsbook is offering better odds than the true probability warrants."
      bullets={[
        "Fair odds calculated from market consensus across all tracked books",
        "EV% displayed for every qualifying bet so you know exactly how much edge you have",
        "¼ Kelly stake sizing recommendations based on your bankroll",
        "Filterable by sport, league, and minimum EV threshold",
        "Real-time alerts as new +EV opportunities appear",
      ]}
      visual={<EVCardVisual />}
      reverse
    />
  );
}
