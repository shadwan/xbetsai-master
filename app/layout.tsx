import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/src/providers/convex-provider";
import QueryProvider from "@/src/providers/query-provider";
import "motion-icons-react/style.css";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "xBetsAI — AI-Powered Sports Betting Intelligence",
    template: "%s — xBetsAI",
  },
  description:
    "Compare odds across DraftKings, FanDuel, BetMGM, Bet365 and more. Find smart bets, guaranteed winners, and the best prices — all powered by AI.",
  keywords: [
    "sports betting odds comparison",
    "odds comparison tool",
    "best sports betting odds",
    "surebet finder",
    "guaranteed profit betting",
    "positive EV betting",
    "smart betting tool",
    "player props analytics",
    "line movement tracker",
    "DraftKings odds",
    "FanDuel odds",
    "BetMGM odds",
    "Bet365 odds",
    "AI sports analytics",
    "sports betting intelligence",
    "NBA odds",
    "NFL odds",
    "MLB odds",
    "NHL odds",
    "value bets",
    "arbitrage betting",
    "real time odds",
  ],
  metadataBase: new URL("https://xbets.ai"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xbets.ai",
    siteName: "xBetsAI",
    title: "xBetsAI — Stop Guessing. Let AI Find Your Edge.",
    description:
      "Compare odds from every major sportsbook, find bets where the math is in your favor, and spot guaranteed winners. AI-powered sports betting intelligence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "xBetsAI — AI-Powered Sports Betting Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "xBetsAI — Stop Guessing. Let AI Find Your Edge.",
    description:
      "Compare odds from every major sportsbook, find smart bets, and spot guaranteed winners. AI-powered sports betting intelligence.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://xbets.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>
            <QueryProvider>{children}</QueryProvider>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
