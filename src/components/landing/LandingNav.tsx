import Link from "next/link";
import Image from "next/image";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#060b12]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo_dark.svg"
            alt="xBetsAI"
            width={140}
            height={28}
            className="h-6 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="#features"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            Features
          </a>
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-neon-gold px-4 py-2 text-sm font-bold text-[#0a0f18] transition-all hover:brightness-110"
          >
            Free Trial &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
