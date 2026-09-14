import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { listAllOrders, updateOrderStatus, ORDER_STATUSES, type Order, type OrderStatus } from "../../lib/orders";

const STATUS_FILTERS = ["all", ...ORDER_STATUSES] as const;
const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-surface-2 text-text-secondary",
  confirmed: "bg-accent-secondary/20 text-accent-secondary",
  printing: "bg-accent-secondary/20 text-accent-secondary",
  shipped: "bg-accent-primary/20 text-accent-primary",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-accent-warm/20 text-accent-warm",
};

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [count, setCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await listAllOrders({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        page_size: PAGE_SIZE,
      });
      setOrders(data.results);
      setCount(data.count);
    } catch {
      setError("Could not load orders.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  async function handleStatusChange(order: Order, newStatus: OrderStatus) {
    try {
      await updateOrderStatus(order.id, newStatus);
      await load();
    } catch {
      setError("Could not update order status.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Orders
      </h1>
      <p className="mt-2 font-body text-sm text-text-secondary">
        {count} order{count !== 1 ? "s" : ""}.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number]);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm capitalize text-text-primary focus:border-accent-primary focus:outline-none"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Status" : s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Order</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Customer</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Items</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Total</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Placed</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-body text-sm font-medium text-text-primary">#{order.order_number}</td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-primary">
                  ₹{order.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                    className={`rounded-pill px-2.5 py-1 font-body text-xs capitalize focus:outline-none ${STATUS_STYLES[order.status] ?? "bg-surface-2 text-text-secondary"}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders && orders.length === 0 && (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <Receipt size={40} className="text-text-secondary" />
            <p className="font-body text-sm text-text-secondary">No orders found.</p>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="font-body text-sm text-text-secondary">
              Showing <span className="text-text-primary">{(page - 1) * PAGE_SIZE + 1}-{(page - 1) * PAGE_SIZE + orders.length}</span> of{" "}
              <span className="text-text-primary">{count}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-body text-sm text-text-primary">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
