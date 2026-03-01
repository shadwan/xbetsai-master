import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureSectionProps {
  icon: LucideIcon;
  accent: string;
  bg: string;
  ring: string;
  title: string;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}

export function FeatureSection({
  icon: Icon,
  accent,
  bg,
  ring,
  title,
  description,
  bullets,
  visual,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <div
        className={cn(
          "mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        {/* Text side */}
        <div>
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1",
              bg,
              ring,
            )}
          >
            <Icon size={24} className={accent} />
          </div>
          <h2 className="mt-5 text-3xl font-[800] tracking-tight text-text-primary sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            {description}
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-text-secondary">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", bg)} />
                <span className="text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual side */}
        <div>{visual}</div>
      </div>
    </section>
  );
}
