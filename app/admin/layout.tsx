"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/src/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/app");
    }
  }, [user, router]);

  if (isLoading || user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || (user && user.role !== "admin")) return null;

  return (
    <div className="flex min-h-screen bg-base">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
