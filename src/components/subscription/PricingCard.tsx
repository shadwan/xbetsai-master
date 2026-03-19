"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

const features = [
  "Real-time odds from 5 major bookmakers",
  "AI-powered value bet detection",
  "Surebet guaranteed winner alerts",
  "Player props analytics",
  "Line movement tracking",
  "6 major sports leagues",
];

type Plan = "monthly" | "annual";

function SingleCard({
  plan,
  highlighted,
  onSubscribe,
  loading,
}: {
  plan: Plan;
  highlighted?: boolean;
  onSubscribe: (plan: Plan) => void;
  loading: boolean;
}) {
  const isAnnual = plan === "annual";

  return (
    <div
      className={`relative w-full max-w-sm rounded-2xl border p-8 shadow-xl ${
        highlighted
          ? "border-neon-gold/30 bg-surface shadow-neon-gold/5"
          : "border-white/[0.06] bg-surface"
      }`}
    >
      {isAnnual && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neon-green px-3 py-0.5 text-xs font-bold text-[#0a0f18]">
          Save $79.88
        </div>
      )}

      <div className="mb-6 text-center">
        <div
          className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            highlighted
              ? "bg-neon-gold/10 text-neon-gold"
              : "bg-white/[0.06] text-text-secondary"
          }`}
        >
          {isAnnual ? "PRO YEARLY" : "PRO MONTHLY"}
        </div>

        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-text-primary">
            {isAnnual ? "$100" : "$14.99"}
          </span>
          <span className="text-text-secondary">
            {isAnnual ? "/year" : "/month"}
          </span>
        </div>

        {isAnnual && (
          <p className="mt-1 text-sm text-text-secondary">
            That&apos;s just $8.33/month
          </p>
        )}

        <p className="mt-2 text-sm text-text-secondary">
          Full access to all xBetsAI features
        </p>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
            <span className="text-sm text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSubscribe(plan)}
        disabled={loading}
        className={`w-full font-bold ${
          highlighted
            ? "bg-neon-gold text-[#0a0f18] hover:brightness-110"
            : "bg-white/[0.06] text-text-primary hover:bg-white/[0.1]"
        }`}
      >
        {loading
          ? "Redirecting…"
          : `Subscribe — ${isAnnual ? "$100/yr" : "$14.99/mo"}`}
      </Button>
    </div>
  );
}

export function PricingCard() {
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  const handleSubscribe = async (plan: Plan) => {
    setLoadingPlan(plan);
    try {
      const url = await createCheckout({ plan });
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
      <SingleCard
        plan="monthly"
        onSubscribe={handleSubscribe}
        loading={loadingPlan === "monthly"}
      />
      <SingleCard
        plan="annual"
        highlighted
        onSubscribe={handleSubscribe}
        loading={loadingPlan === "annual"}
      />
    </div>
  );
}
