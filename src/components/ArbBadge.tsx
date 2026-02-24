import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArbBadgeProps {
  profitPercentage: number;
  className?: string;
}

export function ArbBadge({ profitPercentage, className }: ArbBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-neon-yellow/30 bg-neon-yellow/15 text-neon-yellow",
        className,
      )}
    >
      SUREBET +{(profitPercentage ?? 0).toFixed(1)}%
    </Badge>
  );
}
