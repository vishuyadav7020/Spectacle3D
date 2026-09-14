import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { listMyOrders, type Order } from "../lib/orders";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-surface-2 text-text-secondary",
  confirmed: "bg-accent-secondary/20 text-accent-secondary",
  printing: "bg-accent-secondary/20 text-accent-secondary",
  shipped: "bg-accent-primary/20 text-accent-primary",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-accent-warm/20 text-accent-warm",
};

export function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyOrders()
      .then((data) => setOrders(data.results))
      .catch(() => setError("Could not load your orders."));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="px-6 py-12 md:px-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          My Orders
        </h1>

        {error && <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>}

        {orders && orders.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <Package size={40} className="text-text-secondary" />
            <p className="font-body text-sm text-text-secondary">
              You haven't placed any orders yet.
            </p>
            <Link to="/shop" className="font-body text-sm text-accent-primary hover:underline">
              Start Shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                  <div>
                    <p className="font-body text-sm font-semibold text-text-primary">
                      #{order.order_number}
                    </p>
                    <p className="font-body text-xs text-text-secondary">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`rounded-pill px-3 py-1 font-body text-xs capitalize ${STATUS_STYLES[order.status] ?? "bg-surface-2 text-text-secondary"}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex flex-col gap-3 py-4">
                  {order.items.map((item, idx) => (
                    <div key={`${item.product_id}:${item.variant_id ?? idx}`} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm text-text-primary">{item.name}</p>
                        <p className="font-body text-xs text-text-secondary">
                          {item.material}
                          {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                        </p>
                      </div>
                      <p className="font-body text-sm font-medium text-text-primary">
                        ₹{item.subtotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-body text-sm text-text-secondary">Total</span>
                  <span className="font-display text-lg font-bold text-text-primary">
                    ₹{order.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
