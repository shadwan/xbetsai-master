import { LandingNav } from "@/src/components/landing/LandingNav";
import { FeaturesHero } from "@/src/components/features/FeaturesHero";
import { FeaturesOddsComparison } from "@/src/components/features/FeaturesOddsComparison";
import { FeaturesEVDetection } from "@/src/components/features/FeaturesEVDetection";
import { FeaturesArbitrage } from "@/src/components/features/FeaturesArbitrage";
import { FeaturesPlayerProps } from "@/src/components/features/FeaturesPlayerProps";
import { FeaturesLineMovement } from "@/src/components/features/FeaturesLineMovement";
import { FeaturesRealtime } from "@/src/components/features/FeaturesRealtime";
import { FeaturesCTA } from "@/src/components/features/FeaturesCTA";

export const metadata = {
  title: "Features — xBetsAI",
  description:
    "Real-time odds comparison, +EV detection, arbitrage scanning, player props, and line movement tracking — every tool you need to beat the books.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#060b12]">
      <LandingNav />
      <FeaturesHero />
      <FeaturesOddsComparison />
      <FeaturesEVDetection />
      <FeaturesArbitrage />
      <FeaturesPlayerProps />
      <FeaturesLineMovement />
      <FeaturesRealtime />
      <FeaturesCTA />
    </div>
  );
}
