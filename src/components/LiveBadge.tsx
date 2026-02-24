import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
}

export function LiveBadge({ className }: LiveBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-neon-red/30 bg-neon-red/15 text-neon-red gap-1.5",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-live rounded-full bg-neon-red opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
      </span>
      LIVE
    </Badge>
  );
}
