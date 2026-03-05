"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  sent: { label: "Sent", color: "text-blue-400", icon: Clock },
  delivered: { label: "Delivered", color: "text-green-400", icon: CheckCircle },
  bounced: { label: "Bounced", color: "text-red-400", icon: XCircle },
  failed: { label: "Failed", color: "text-red-400", icon: XCircle },
  complained: {
    label: "Complained",
    color: "text-yellow-400",
    icon: AlertTriangle,
  },
  delivery_delayed: {
    label: "Delayed",
    color: "text-yellow-400",
    icon: Clock,
  },
};

const emailTypeLabels: Record<string, string> = {
  welcome: "Welcome",
  password_reset: "Password Reset",
  subscription_confirmed: "Subscription Confirmed",
  payment_receipt: "Payment Receipt",
  subscription_canceled: "Subscription Canceled",
  payment_failed: "Payment Failed",
};

export default function AdminEmailsPage() {
  const logs = useQuery(api.admin.listEmailLogs);

  if (!logs) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Email Logs</h1>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Email Logs</h1>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Mail className="h-4 w-4" />
          {logs.length} emails
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
          <p className="mt-4 text-text-secondary">No emails sent yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-text-secondary">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-text-secondary">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-text-secondary">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-text-secondary">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const status = statusConfig[log.status] ?? {
                  label: log.status,
                  color: "text-text-secondary",
                  icon: Clock,
                };
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={log._id}
                    className="bg-surface transition-colors hover:bg-surface/80"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400">
                        {emailTypeLabels[log.emailType] ?? log.emailType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {log.userName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {log.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-text-primary">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`flex items-center gap-1.5 text-sm ${status.color}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
