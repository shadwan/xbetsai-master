interface LiveBadgeProps {
  className?: string;
}

export function LiveBadge({ className = "" }: LiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-neon-red/30 bg-neon-red/15 px-2 py-0.5 text-xs font-semibold text-neon-red ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-live rounded-full bg-neon-red opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
      </span>
      LIVE
    </span>
  );
}
