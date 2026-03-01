import Link from "next/link";

export function FeaturesCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-neon-gold/20 bg-[#0d1520] p-10 text-center sm:p-16">
          {/* Gradient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-gold/[0.06] blur-[100px]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-[800] tracking-tight text-text-primary sm:text-4xl">
              Ready to Find Your Edge?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
              Stop leaving money on the table. Get access to every tool above
              and start making smarter, data-driven bets today.
            </p>
            <div className="mt-8">
              <Link
                href="/app"
                className="inline-block rounded-xl bg-neon-gold px-10 py-4 text-base font-bold text-[#0a0f18] shadow-[0_0_30px_rgba(241,225,133,0.2)] transition-all hover:shadow-[0_0_40px_rgba(241,225,133,0.35)] hover:brightness-110"
              >
                Get Started &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
