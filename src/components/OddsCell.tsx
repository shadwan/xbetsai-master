"use client";

import { useRef, useEffect } from "react";
import { decimalToAmerican } from "@/src/lib/utils/odds";

interface OddsCellProps {
  decimalOdds: number | null;
  isBest?: boolean;
  marketType?: string;
  previousOdds?: number | null;
}

export function OddsCell({ decimalOdds, isBest, previousOdds }: OddsCellProps) {
  const prevRef = useRef<number | null | undefined>(previousOdds);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    const prev = prevRef.current;
    prevRef.current = decimalOdds;

    if (el == null || decimalOdds == null || prev == null) return;

    if (decimalOdds > prev) {
      el.classList.add("animate-flash-green");
    } else if (decimalOdds < prev) {
      el.classList.add("animate-flash-red");
    }
  }, [decimalOdds]);

  const handleAnimationEnd = () => {
    elRef.current?.classList.remove("animate-flash-green", "animate-flash-red");
  };

  if (decimalOdds == null) {
    return (
      <div className="flex h-10 items-center justify-center rounded bg-surface text-text-tertiary font-mono text-sm">
        —
      </div>
    );
  }

  const american = decimalToAmerican(decimalOdds);
  const display = american > 0 ? `+${american}` : `${american}`;

  return (
    <div
      ref={elRef}
      onAnimationEnd={handleAnimationEnd}
      className={`flex h-10 items-center justify-center rounded font-mono text-sm transition-colors ${
        isBest
          ? "ring-1 ring-neon-cyan/40 bg-neon-cyan/5 text-neon-cyan"
          : "bg-surface text-text-primary hover:bg-hover"
      }`}
    >
      {display}
    </div>
  );
}
