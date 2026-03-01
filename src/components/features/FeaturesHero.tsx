export function FeaturesHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Radial gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-gold/[0.04] blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/[0.03] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-[800] leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
          Every Tool You Need to{" "}
          <span className="bg-gradient-to-r from-neon-gold via-[#f5e6a3] to-neon-gold bg-clip-text text-transparent">
            Beat the Books
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
          Real-time odds, +EV detection, arbitrage scanning, player props, and
          line movement tracking — all powered by AI and updated the moment lines
          change.
        </p>
      </div>
    </section>
  );
}
