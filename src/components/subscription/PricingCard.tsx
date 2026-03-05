"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

const features = [
  "Real-time odds from 5 major bookmakers",
  "AI-powered value bet detection",
  "Arbitrage opportunity alerts",
  "Player props analysis",
  "Line movement tracking",
  "6 major sports leagues",
];

export function PricingCard() {
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const url = await createCheckout();
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neon-gold/30 bg-surface p-8 shadow-xl shadow-neon-gold/5">
      <div className="mb-6 text-center">
        <div className="mb-2 inline-block rounded-full bg-neon-gold/10 px-3 py-1 text-xs font-semibold text-neon-gold">
          PRO
        </div>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-text-primary">$29</span>
          <span className="text-text-secondary">/month</span>
        </div>
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
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-neon-gold text-[#0a0f18] font-bold hover:brightness-110"
      >
        {loading ? "Redirecting…" : "Subscribe to Pro"}
      </Button>
    </div>
  );
}
