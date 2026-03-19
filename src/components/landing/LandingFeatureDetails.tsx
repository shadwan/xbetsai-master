import { BarChart3, Zap, Trophy, Users, TrendingUp, Radio } from "lucide-react";
import { FeatureSection } from "@/src/components/features/FeatureSection";

// ── Odds Comparison Visual ─────────────────────────────────────────────────

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
        <span>Best price highlighted automatically</span>
      </div>
    </div>
  );
}

// ── Smart Bet Finder Visual ────────────────────────────────────────────────

function EVCardVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Smart Bet Found
        </span>
        <span className="rounded-full bg-neon-green/10 px-2.5 py-0.5 text-xs font-bold text-neon-green">
          +5.2% Edge
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-text-primary">
          Chiefs to Win vs Ravens
        </p>
        <p className="mt-1 text-xs text-text-tertiary">NFL — Sunday 1:00 PM</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-tertiary">What the book is paying</p>
            <p className="mt-1 font-mono text-lg font-bold text-text-primary">
              +155
            </p>
            <p className="text-xs text-text-tertiary">DraftKings</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">What it should be</p>
            <p className="mt-1 font-mono text-lg font-bold text-neon-green">
              +138
            </p>
            <p className="text-xs text-text-tertiary">Based on all books</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">Suggested bet size</span>
            <span className="font-mono font-semibold text-neon-gold">
              $25.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Surebet Visual ─────────────────────────────────────────────────────────

function SurebetVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Guaranteed Winner Found
        </span>
        <span className="rounded-full bg-neon-yellow/10 px-2.5 py-0.5 text-xs font-bold text-neon-yellow">
          +2.8% Profit
        </span>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Bet 1 — DraftKings</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                Yankees to Win
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-text-primary">
                +145
              </p>
              <p className="text-xs text-text-tertiary">Bet $408</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Bet 2 — FanDuel</p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                Red Sox to Win
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-bold text-text-primary">
                -135
              </p>
              <p className="text-xs text-text-tertiary">Bet $592</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-neon-yellow/20 bg-neon-yellow/[0.05] px-4 py-2.5">
        <span className="text-sm font-medium text-text-primary">
          You win no matter what
        </span>
        <span className="font-mono text-lg font-bold text-neon-yellow">
          $28.00
        </span>
      </div>
    </div>
  );
}

// ── Player Props Visual ────────────────────────────────────────────────────

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
            Celtics — Points Over/Under 28.5
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

// ── Line Movement Visual ───────────────────────────────────────────────────

function LineMovementVisual() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Line Movement — Bills vs Dolphins
        </span>
        <span className="text-xs text-text-tertiary">Spread</span>
      </div>

      <div className="relative h-36 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
        <div className="absolute left-2 top-3 flex flex-col justify-between h-[calc(100%-24px)] text-[10px] text-text-tertiary font-mono">
          <span>-2.5</span>
          <span>-3.0</span>
          <span>-3.5</span>
        </div>

        <svg
          viewBox="0 0 200 80"
          className="ml-6 h-full w-[calc(100%-24px)]"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(255,255,255,0.04)" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.04)" />
          <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.04)" />
          <polyline points="0,20 40,25 80,30 120,15 160,35 200,30" fill="none" stroke="#F1E185" strokeWidth="2" />
          <polyline points="0,25 40,30 80,35 120,25 160,40 200,38" fill="none" stroke="#39ff14" strokeWidth="2" />
          <polyline points="0,22 40,28 80,32 120,20 160,38 200,35" fill="none" stroke="#b388ff" strokeWidth="2" />
        </svg>
      </div>

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

// ── Combined Feature Details ───────────────────────────────────────────────

export function LandingFeatureDetails() {
  return (
    <div>
      <FeatureSection
        icon={BarChart3}
        accent="text-neon-gold"
        bg="bg-neon-gold/10"
        ring="ring-neon-gold/20"
        title="Compare Every Price, Instantly"
        description="Different sportsbooks offer different odds on the same game. We show them all side by side so you can always pick the best one. Think of it like a price comparison site, but for bets."
        bullets={[
          "Odds from 5 major sportsbooks shown on one screen",
          "The best price is highlighted so you spot it instantly",
          "Click through to place your bet at the right book",
          "Works for moneylines, spreads, and totals",
          "Updates in real time as odds change",
        ]}
        visual={<OddsTableVisual />}
      />

      <FeatureSection
        icon={Zap}
        accent="text-neon-green"
        bg="bg-neon-green/10"
        ring="ring-neon-green/20"
        title="Know When the Odds Are in Your Favor"
        description="Sometimes a sportsbook sets odds higher than they should be. We compare prices across every book to figure out the true odds, then flag bets where you have a mathematical edge."
        bullets={[
          "We calculate what the odds should really be based on all sportsbooks",
          "You see exactly how much edge you have on each bet",
          "Suggested bet sizing so you don't risk too much",
          "Filter by sport, league, or how big the edge is",
          "Alerts pop up the moment a new opportunity appears",
        ]}
        visual={<EVCardVisual />}
        reverse
      />

      <FeatureSection
        icon={Trophy}
        accent="text-neon-yellow"
        bg="bg-neon-yellow/10"
        ring="ring-neon-yellow/20"
        title="Guaranteed Winners — Profit No Matter Who Wins"
        description="When two sportsbooks disagree on the odds enough, you can bet both sides and guarantee a profit regardless of the outcome. We scan every book 24/7 and tell you exactly how much to bet on each side."
        bullets={[
          "We automatically find these guaranteed profit opportunities",
          "You see exactly how much to bet on each side",
          "The guaranteed profit amount is shown upfront",
          "Step-by-step so you know exactly where to place each bet",
          "Freshness indicators tell you how current the odds are",
        ]}
        visual={<SurebetVisual />}
      />

      <FeatureSection
        icon={Users}
        accent="text-purple-400"
        bg="bg-purple-400/10"
        ring="ring-purple-400/20"
        title="Player Props — Find the Best Lines for Any Player"
        description="Betting on how many points, rebounds, or strikeouts a player will get? We compare those odds across every sportsbook so you always get the best price on player prop bets."
        bullets={[
          "Over/under odds from every book shown side by side",
          "Best lines are highlighted so you know where to bet",
          "Covers points, rebounds, assists, strikeouts, and more",
          "Player info pulled from ESPN so you know who you're betting on",
          "Edge detection flags lines that are mispriced",
        ]}
        visual={<PlayerPropsVisual />}
        reverse
      />

      <FeatureSection
        icon={TrendingUp}
        accent="text-neon-cyan"
        bg="bg-neon-cyan/10"
        ring="ring-neon-cyan/20"
        title="See Where the Money Is Moving"
        description="Odds change leading up to a game — sometimes a lot. Our line movement charts show you how odds have shifted over time at each sportsbook, so you can spot trends and time your bets."
        bullets={[
          "See how odds have changed over the last hours and days",
          "Each sportsbook gets its own color-coded line on the chart",
          "Works for moneylines, spreads, and totals",
          "Spot big moves that signal sharp money or breaking news",
          "Decide the best time to place your bet",
        ]}
        visual={<LineMovementVisual />}
      />
    </div>
  );
}
