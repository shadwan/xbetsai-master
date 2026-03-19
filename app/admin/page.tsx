"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  UserPlus,
  Percent,
  CalendarClock,
  XCircle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        <Icon className="h-4 w-4 text-text-secondary" />
      </div>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const stats = useQuery(api.admin.dashboardStats);

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* Primary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          label="Recent Signups"
          value={stats.recentSignups}
          icon={UserPlus}
          subtitle="Last 7 days"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={Percent}
          subtitle={`${stats.activeSubscriptions} of ${stats.totalUsers} users`}
        />
        <StatCard
          label="Estimated MRR"
          value={`$${stats.estimatedMRR.toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      {/* Subscription breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
        />
        <StatCard
          label="Plan Breakdown"
          value={`${stats.monthlyCount}mo / ${stats.annualCount}yr`}
          icon={CalendarClock}
          subtitle={`${stats.monthlyCount} monthly, ${stats.annualCount} annual`}
        />
        <StatCard
          label="Canceled"
          value={stats.canceledSubscriptions}
          icon={XCircle}
        />
        <StatCard
          label="Past Due"
          value={stats.pastDueSubscriptions}
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}
