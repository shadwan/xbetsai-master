"use client";

import { useQuery, useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PricingCard } from "@/src/components/subscription/PricingCard";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SubscribePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const createPortal = useAction(api.stripe.createPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.hasActiveSubscription) {
      router.replace("/app");
    }
  }, [user, router]);

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const url = await createPortal();
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create portal session:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-gold border-t-transparent" />
      </div>
    );
  }

  const isCanceled =
    user?.subscription?.status === "canceled" ||
    user?.subscription?.cancelAtPeriodEnd;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4">
      <div className="mb-8">
        <Link href="/">
          <Image
            src="/logo_dark.svg"
            alt="xBetsAI"
            width={160}
            height={32}
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-text-primary">
        {isCanceled ? "Reactivate Your Subscription" : "Unlock xBetsAI Pro"}
      </h1>
      <p className="mb-8 max-w-md text-center text-text-secondary">
        {isCanceled
          ? "Your subscription has ended. Resubscribe to regain full access."
          : "Get full access to real-time odds, AI analytics, and arbitrage detection."}
      </p>

      {isAuthenticated ? (
        <>
          <PricingCard />
          {user?.subscription && (
            <Button
              variant="ghost"
              onClick={handleManage}
              disabled={portalLoading}
              className="mt-4 text-sm text-text-secondary"
            >
              {portalLoading ? "Loading…" : "Manage existing billing"}
            </Button>
          )}
          <Link href="/app" className="mt-4">
            <Button variant="ghost" className="text-sm text-text-secondary hover:text-text-primary">
              Skip for now
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-text-secondary">
            Sign in or create an account to subscribe.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-neon-gold text-[#0a0f18] font-bold hover:brightness-110">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
