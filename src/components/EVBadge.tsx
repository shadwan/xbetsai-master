interface EVBadgeProps {
  valuePercentage: number;
  className?: string;
}

export function EVBadge({ valuePercentage, className = "" }: EVBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-neon-green/15 border border-neon-green/30 px-2 py-0.5 text-xs font-semibold text-neon-green ${className}`}
    >
      +{(valuePercentage ?? 0).toFixed(1)}% EV
    </span>
  );
}
