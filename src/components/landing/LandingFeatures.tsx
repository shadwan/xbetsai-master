import { BarChart3, Zap, Trophy, TrendingUp, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Side-by-Side Odds",
    description:
      "See prices from DraftKings, FanDuel, BetMGM, Unibet, and Bet365 next to each other. The best price is highlighted so you never bet at the wrong book.",
    accent: "text-neon-gold",
    bg: "bg-neon-gold/10",
    ring: "ring-neon-gold/20",
  },
  {
    icon: Zap,
    title: "Smart Bet Finder",
    description:
      "We crunch the numbers across every sportsbook and tell you when a bet is priced higher than it should be. That means the odds are in your favor.",
    accent: "text-neon-green",
    bg: "bg-neon-green/10",
    ring: "ring-neon-green/20",
  },
  {
    icon: Trophy,
    title: "Surebet Guaranteed Winners",
    description:
      "When two sportsbooks disagree on the odds, you can bet both sides and lock in a profit no matter who wins. We find those for you automatically.",
    accent: "text-neon-yellow",
    bg: "bg-neon-yellow/10",
    ring: "ring-neon-yellow/20",
  },
  {
    icon: Users,
    title: "Player Props Analytics",
    description:
      "Compare player prop bets (points, rebounds, assists, strikeouts, and more) across every book to find the best lines and spot mispriced odds.",
    accent: "text-purple-400",
    bg: "bg-purple-400/10",
    ring: "ring-purple-400/20",
  },
  {
    icon: TrendingUp,
    title: "Line Movement Tracker",
    description:
      "Watch how odds change over time. See which direction the money is moving so you can decide when to place your bet.",
    accent: "text-neon-cyan",
    bg: "bg-neon-cyan/10",
    ring: "ring-neon-cyan/20",
  },
  {
    icon: Radio,
    title: "Live Updates",
    description:
      "Odds update in real time as they change. No need to refresh the page — new prices, alerts, and opportunities show up instantly.",
    accent: "text-neon-red",
    bg: "bg-neon-red/10",
    ring: "ring-neon-red/20",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-[800] tracking-tight text-text-primary sm:text-4xl">
            Everything You Need to Bet Smarter
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
            One dashboard with every tool to find better bets, better prices, and
            guaranteed winners.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
