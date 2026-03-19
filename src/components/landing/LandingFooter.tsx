import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#060b12]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link href="/">
            <Image
              src="/logo_dark.svg"
              alt="xBetsAI"
              width={120}
              height={24}
              className="h-5 w-auto opacity-60"
            />
          </Link>

          <div className="flex items-center gap-6 text-sm text-text-tertiary">
            <Link
              href="/privacy"
              className="transition-colors hover:text-text-secondary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-text-secondary"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.04] pt-6 text-center text-xs text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} xBetsAI. All rights reserved.</p>
          <p className="mt-2 max-w-2xl mx-auto leading-relaxed">
            xBetsAI is a sports analytics and information platform. We do not
            facilitate, process, or accept any wagers or bets. All betting
            decisions are made solely by the user through licensed third-party
            sportsbooks. Please gamble responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
