import { BarChart3, Zap, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-Time Odds",
    description:
      "Compare odds across DraftKings, FanDuel, BetMGM, Caesars, and Bet365 — updated in real time via WebSocket.",
    accent: "text-neon-gold",
    bg: "bg-neon-gold/10",
    ring: "ring-neon-gold/20",
  },
  {
    icon: Zap,
    title: "+EV Detection",
    description:
      "Our engine calculates fair odds from market consensus and surfaces positive expected value bets instantly.",
    accent: "text-neon-green",
    bg: "bg-neon-green/10",
    ring: "ring-neon-green/20",
  },
  {
    icon: Trophy,
    title: "Arbitrage Finder",
    description:
      "Automatically detects surebet opportunities across books — guaranteed profit regardless of outcome.",
    accent: "text-neon-yellow",
    bg: "bg-neon-yellow/10",
    ring: "ring-neon-yellow/20",
  },
  {
    icon: Users,
    title: "Player Props",
    description:
      "Deep prop market analysis with player-level odds comparison, powered by ESPN roster data.",
    accent: "text-purple-400",
    bg: "bg-purple-400/10",
    ring: "ring-purple-400/20",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-[800] tracking-tight text-text-primary sm:text-4xl">
            Your Unfair Advantage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            Everything you need to find profitable bets, in one dashboard.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={cn(
                "group rounded-2xl border border-white/[0.06] bg-[#0d1520] p-6 transition-all hover:border-white/10 hover:shadow-[0_0_40px_rgba(0,0,0,0.3)]",
              )}
            >
              <div
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1",
                  f.bg,
                  f.ring,
                )}
              >
                <f.icon size={22} className={f.accent} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-text-primary">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
