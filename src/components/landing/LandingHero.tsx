import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Radial gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-gold/[0.04] blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/[0.03] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32 lg:py-40">
        <h1 className="text-4xl font-[800] leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-7xl">
          Stop Guessing.{" "}
          <span className="bg-gradient-to-r from-neon-gold via-[#f5e6a3] to-neon-gold bg-clip-text text-transparent">
            Start Winning.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
          We compare odds from every major sportsbook so you always get the best
          price. Find bets where the math is in your favor, spot guaranteed
          winners, and never overpay again.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-xl bg-neon-gold px-8 py-3.5 text-base font-bold text-[#0a0f18] shadow-[0_0_30px_rgba(241,225,133,0.2)] transition-all hover:shadow-[0_0_40px_rgba(241,225,133,0.35)] hover:brightness-110"
          >
            Start Free Trial &rarr;
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-base font-semibold text-text-primary transition-all hover:border-white/20 hover:bg-white/[0.06]"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
