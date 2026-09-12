import { Link, useLocation, Navigate } from "react-router-dom";
import { Check, MapPin, Printer } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import { CheckoutSteps } from "../components/ui/CheckoutSteps";
import type { CartItem } from "../lib/cart";

export interface OrderSummary {
  orderNumber: string;
  orderDate: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  cardLast4: string;
}

export function OrderConfirmation() {
  const location = useLocation();
  const order = location.state as OrderSummary | null;

  if (!order) {
    return <Navigate to="/" replace />;
  }

  const { shippingAddress: addr } = order;

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-16">
        <Link to="/" className="font-display text-2xl font-bold text-text-primary">
          Spectacle<span className="text-accent-primary">3D</span>
        </Link>
        <Link to="/shop" className="font-body text-sm text-text-secondary hover:text-text-primary">
          Continue Shopping
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 md:px-16">
        <CheckoutSteps current={2} />

        <div className="mt-10 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/20 text-accent-primary">
            <Check size={28} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-text-primary">
            Thank You for Your Order!
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Your order has been placed successfully.
          </p>
          <div className="mt-4 rounded-md border border-border px-4 py-2 font-body text-sm text-text-secondary">
            Order Number{" "}
            <span className="font-semibold text-accent-primary">
              #{order.orderNumber}
            </span>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-border bg-surface p-6">
          <div className="grid grid-cols-3 gap-4 border-b border-border pb-4 font-body text-sm">
            <div>
              <p className="text-text-secondary">Order Date</p>
              <p className="mt-1 text-text-primary">{order.orderDate}</p>
            </div>
            <div>
              <p className="text-text-secondary">Payment Method</p>
              <p className="mt-1 text-text-primary">Card •••• {order.cardLast4}</p>
            </div>
            <div>
              <p className="text-text-secondary">Estimated Delivery</p>
              <p className="mt-1 text-text-primary">5-7 business days</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 py-4">
            {order.items.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-text-primary">{item.name}</p>
                  <p className="font-body text-xs text-text-secondary">
                    {item.material} · Qty {item.quantity}
                  </p>
                </div>
                <p className="font-body text-sm font-medium text-text-primary">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 font-body text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{order.shipping.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹{order.tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between border-t border-border pt-3">
            <span className="font-body text-base font-semibold text-text-primary">Total</span>
            <span className="font-display text-xl font-bold text-text-primary">
              ₹{order.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-2 font-body text-sm font-semibold text-text-primary">
            <MapPin size={16} className="text-accent-primary" /> Shipping Address
          </div>
          <p className="mt-3 font-body text-sm text-text-secondary">
            {addr.firstName} {addr.lastName}
            <br />
            {addr.street}
            {addr.apt ? `, ${addr.apt}` : ""}
            <br />
            {addr.city}, {addr.state} {addr.zip}
            <br />
            {addr.country}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/shop" className="flex-1">
            <Button variant="secondary" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Button
            variant="primary"
            className="flex flex-1 items-center justify-center gap-2"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print Receipt
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
