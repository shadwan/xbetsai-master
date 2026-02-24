"use client";

import Link from "next/link";
import { SSEIndicator } from "./SSEIndicator";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-mono text-lg font-bold text-neon-cyan">
            xBetsAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/opportunities"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Opportunities
            </Link>
          </nav>
        </div>
        <SSEIndicator />
      </div>
    </header>
  );
}
