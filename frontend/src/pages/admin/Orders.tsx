import { Receipt } from "lucide-react";

export function AdminOrders() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Orders
      </h1>
      <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-16 text-center">
        <Receipt size={40} className="text-text-secondary" />
        <p className="font-body text-sm text-text-secondary">
          Order management needs its own backend (an <code>orders</code> app
          with admin-scoped endpoints) before it can show real data here.
        </p>
      </div>
    </div>
  );
}
