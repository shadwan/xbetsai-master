import { SubscriptionsTable } from "@/src/components/admin/SubscriptionsTable";

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
      <SubscriptionsTable />
    </div>
  );
}
