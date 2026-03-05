"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { SSEIndicator } from "./SSEIndicator";
import { UserButton } from "./auth/UserButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/app" className="flex items-center">
            <Image
              src="/logo_dark.svg"
              alt="xBetsAI"
              width={120}
              height={24}
              className="h-5 w-auto"
            />
          </Link>
          <Separator orientation="vertical" className="!h-5 bg-border" />
          <nav className="flex items-center gap-4">
            <Link
              href="/app"
              className="text-sm text-text-secondary hover:text-neon-cyan transition-colors"
            >
              Home
            </Link>
            <Link
              href="/opportunities"
              className="text-sm text-text-secondary hover:text-neon-cyan transition-colors"
            >
              Opportunities
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SSEIndicator />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
