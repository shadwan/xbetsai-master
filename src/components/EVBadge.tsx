import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EVBadgeProps {
  valuePercentage: number;
  className?: string;
}

export function EVBadge({ valuePercentage, className }: EVBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-neon-green/30 bg-neon-green/15 text-neon-green",
        className,
      )}
    >
      +{(valuePercentage ?? 0).toFixed(1)}% EV
    </Badge>
  );
}
