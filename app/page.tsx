import { LandingNav } from "@/src/components/landing/LandingNav";
import { LandingHero } from "@/src/components/landing/LandingHero";
import { LandingFeatures } from "@/src/components/landing/LandingFeatures";
import { LandingShowcase } from "@/src/components/landing/LandingShowcase";
import { LandingLeagues } from "@/src/components/landing/LandingLeagues";
import { LandingCTA } from "@/src/components/landing/LandingCTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b12]">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingLeagues />
      <LandingCTA />
    </div>
  );
}
