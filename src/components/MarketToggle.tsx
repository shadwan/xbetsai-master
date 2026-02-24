"use client";

type MarketType = "ML" | "Spread" | "Totals";

interface MarketToggleProps {
  active: MarketType;
  onChange: (market: MarketType) => void;
}

const MARKETS: MarketType[] = ["ML", "Spread", "Totals"];

export function MarketToggle({ active, onChange }: MarketToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {MARKETS.map((market) => (
        <button
          key={market}
          onClick={() => onChange(market)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            active === market
              ? "bg-elevated text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {market}
        </button>
      ))}
    </div>
  );
}
