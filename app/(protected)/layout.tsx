"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  );
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && !user.hasActiveSubscription && user.role !== "admin") {
      router.replace("/subscribe");
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-gold border-t-transparent" />
      </div>
    );
  }

  if (user && !user.hasActiveSubscription && user.role !== "admin") return null;

  return <>{children}</>;
}
