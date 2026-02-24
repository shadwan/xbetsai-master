"use client";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "card" | "cell";
}

export function Skeleton({ className = "", variant = "line" }: SkeletonProps) {
  const variantClasses = {
    line: "h-4 w-full rounded",
    card: "h-48 w-full rounded-lg",
    cell: "h-10 w-16 rounded",
  };

  return (
    <div
      className={`bg-elevated animate-pulse ${variantClasses[variant]} ${className}`}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="line" className="w-48 h-5" />
        <Skeleton variant="line" className="w-20 h-5" />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} variant="cell" />
        ))}
      </div>
    </div>
  );
}

export function OddsGridSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
