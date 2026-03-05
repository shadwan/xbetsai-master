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

export function SubscriptionsTable() {
  const subscriptions = useQuery(api.admin.listSubscriptions);
  const cancelSubscription = useAction(api.adminActions.adminCancelSubscription);

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

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Period End</TableHead>
            <TableHead>Auto-Renew</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.stripeSubscriptionId}>
              <TableCell className="text-text-primary">
                <div>
                  <p className="font-medium">{sub.user?.name ?? "—"}</p>
                  <p className="text-xs text-text-secondary">
                    {sub.user?.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    sub.status === "active"
                      ? "default"
                      : sub.status === "past_due"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {sub.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-text-secondary">
                {formatDate(sub.currentPeriodEnd)}
              </TableCell>
              <TableCell>
                {sub.cancelAtPeriodEnd ? (
                  <span className="text-sm text-red-400">Canceling</span>
                ) : (
                  <span className="text-sm text-neon-green">Active</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() =>
                      cancelSubscription({
                        stripeSubscriptionId: sub.stripeSubscriptionId,
                      })
                    }
                  >
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
