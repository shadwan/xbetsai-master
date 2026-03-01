import { SPORTS } from "@/src/lib/odds-api/constants";
import { LeagueLogo } from "@/src/components/LeagueLogo";

export function LandingLeagues() {
  return (
    <section className="border-y border-white/[0.04] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          Supported Leagues
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-10 sm:gap-14">
          {SPORTS.map((sport) => (
            <div
              key={sport.leagueSlug}
              className="flex flex-col items-center gap-2.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <LeagueLogo league={sport.leagueSlug} size={48} />
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                {sport.displayName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
