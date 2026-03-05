"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CreditCard, DollarSign, TrendingUp } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        <Icon className="h-5 w-5 text-text-secondary" />
      </div>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = useQuery(api.admin.dashboardStats);

  if (!stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
        />
        <StatCard
          label="Total Subscriptions"
          value={stats.totalSubscriptions}
          icon={TrendingUp}
        />
        <StatCard
          label="Estimated MRR"
          value={`$${stats.estimatedMRR}`}
          icon={DollarSign}
        />
      </div>
    </div>
  );
}
