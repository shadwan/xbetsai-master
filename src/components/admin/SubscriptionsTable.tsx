"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

type StatusFilter = "all" | "active" | "trialing" | "canceled" | "past_due";

export function SubscriptionsTable() {
  const subscriptions = useQuery(api.admin.listSubscriptions);
  const cancelSubscription = useAction(
    api.adminActions.adminCancelSubscription
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (!subscriptions) return [];
    let result = subscriptions;

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) =>
          s.user?.name?.toLowerCase().includes(q) ||
          s.user?.email?.toLowerCase().includes(q) ||
          s.planName?.toLowerCase().includes(q) ||
          s.stripeSubscriptionId?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [subscriptions, search, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!subscriptions) return { active: 0, trialing: 0, canceled: 0, past_due: 0 };
    return {
      active: subscriptions.filter((s) => s.status === "active").length,
      trialing: subscriptions.filter((s) => s.status === "trialing").length,
      canceled: subscriptions.filter((s) => s.status === "canceled").length,
      past_due: subscriptions.filter((s) => s.status === "past_due").length,
    };
  }, [subscriptions]);

  if (!subscriptions) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  // Stripe component stores timestamps in seconds — convert to ms
  const formatDate = (ts: number) => {
    const ms = ts < 1e12 ? ts * 1000 : ts;
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancel = async (stripeSubscriptionId: string) => {
    setLoadingId(stripeSubscriptionId);
    try {
      await cancelSubscription({ stripeSubscriptionId });
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "trialing":
        return "secondary" as const;
      case "past_due":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const filterButtons: { label: string; value: StatusFilter; count: number }[] =
    [
      { label: "All", value: "all", count: subscriptions.length },
      { label: "Active", value: "active", count: statusCounts.active },
      { label: "Trialing", value: "trialing", count: statusCounts.trialing },
      { label: "Canceled", value: "canceled", count: statusCounts.canceled },
      { label: "Past Due", value: "past_due", count: statusCounts.past_due },
    ];

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Header with search and filters */}
      <div className="space-y-3 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === btn.value
                    ? "bg-neon-gold/20 text-neon-gold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {btn.label}
                <span className="ml-1 opacity-60">{btn.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Period End</TableHead>
            <TableHead>Auto-Renew</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-text-secondary"
              >
                {search || statusFilter !== "all"
                  ? "No subscriptions match your filters."
                  : "No subscriptions found."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((sub) => {
              const isLoading = loadingId === sub.stripeSubscriptionId;
              return (
                <TableRow key={sub.stripeSubscriptionId}>
                  <TableCell className="text-text-primary">
                    <div>
                      <p className="font-medium">{sub.user?.name ?? "—"}</p>
                      <p className="text-xs text-text-secondary">
                        {sub.user?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {sub.planName ?? "Pro"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {formatDate(sub.currentPeriodEnd)}
                  </TableCell>
                  <TableCell>
                    {sub.cancelAtPeriodEnd ? (
                      <Badge variant="destructive" className="text-xs">
                        Cancels {formatDate(sub.currentPeriodEnd)}
                      </Badge>
                    ) : sub.status === "active" ? (
                      <span className="text-sm text-neon-green">Active</span>
                    ) : (
                      <span className="text-sm text-text-secondary">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        disabled={isLoading}
                        onClick={() =>
                          handleCancel(sub.stripeSubscriptionId)
                        }
                      >
                        {isLoading ? "Canceling…" : "Cancel"}
                      </Button>
                    )}
                    {sub.cancelAtPeriodEnd && sub.status === "active" && (
                      <span className="text-xs text-text-secondary">
                        Active until period end
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
