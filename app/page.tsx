import { LandingNav } from "@/src/components/landing/LandingNav";
import { LandingHero } from "@/src/components/landing/LandingHero";
import { LandingFeatures } from "@/src/components/landing/LandingFeatures";
import { LandingFeatureDetails } from "@/src/components/landing/LandingFeatureDetails";
import { LandingShowcase } from "@/src/components/landing/LandingShowcase";
import { LandingLeagues } from "@/src/components/landing/LandingLeagues";
import { LandingCTA } from "@/src/components/landing/LandingCTA";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b12]">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingFeatureDetails />
      <LandingShowcase />
      <LandingLeagues />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
