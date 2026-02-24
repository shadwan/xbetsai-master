"use client";

import { Skeleton } from "@/components/ui/skeleton";
export { Skeleton };

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-base">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>

      <div className="flex justify-center py-1">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full shrink-0 mx-2" />
        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      </div>

      <div className="h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export function OddsGridSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
