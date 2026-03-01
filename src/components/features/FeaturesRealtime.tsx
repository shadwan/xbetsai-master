import { Radio } from "lucide-react";
import { FeatureSection } from "./FeatureSection";

function RealtimeVisual() {
  const events = [
    { type: "odds", label: "Odds updated — Chiefs ML", time: "just now", color: "bg-neon-gold" },
    { type: "arb", label: "New surebet — Yankees/Red Sox", time: "3s ago", color: "bg-neon-yellow" },
    { type: "ev", label: "+EV detected — Bills +3.5", time: "8s ago", color: "bg-neon-green" },
    { type: "event", label: "Event added — Lakers @ Celtics", time: "15s ago", color: "bg-purple-400" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d1520] p-5">
      {/* Connection indicator */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          Live Stream
        </span>
        <div className="flex items-center gap-2 rounded-full border border-neon-green/20 bg-neon-green/[0.05] px-3 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-neon-green" />
          <span className="text-xs font-semibold text-neon-green">
            Connected
          </span>
        </div>
      </div>

      {/* Event stream */}
      <div className="space-y-2">
        {events.map((e, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
          >
            <div className={`h-2 w-2 shrink-0 rounded-full ${e.color}`} />
            <span className="flex-1 text-sm text-text-primary">{e.label}</span>
            <span className="shrink-0 text-xs text-text-tertiary">
              {e.time}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-xs text-text-tertiary">
        Server-Sent Events • Auto-merges into dashboard
      </div>
    </div>
  );
}

export function FeaturesRealtime() {
  return (
    <FeatureSection
      icon={Radio}
      accent="text-neon-red"
      bg="bg-neon-red/10"
      ring="ring-neon-red/20"
      title="Live Data, the Moment It Changes"
      description="Our SSE streaming pipeline pushes odds changes, new events, and value bets directly to your dashboard the instant they happen — no refresh required."
      bullets={[
        "Server-Sent Events (SSE) streaming for sub-second updates",
        "Instant odds, event, value-bet, and arb-bet update notifications",
        "Connection status indicator shows you're always live",
        "Auto-merges into your dashboard without disrupting your workflow",
        "No manual refresh needed — ever",
      ]}
      visual={<RealtimeVisual />}
      reverse
    />
  );
}
