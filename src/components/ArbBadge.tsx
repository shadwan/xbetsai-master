interface ArbBadgeProps {
  profitPercentage: number;
  className?: string;
}

export function ArbBadge({ profitPercentage, className = "" }: ArbBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-neon-yellow/15 border border-neon-yellow/30 px-2 py-0.5 text-xs font-semibold text-neon-yellow ${className}`}
    >
      SUREBET +{(profitPercentage ?? 0).toFixed(1)}%
    </span>
  );
}
