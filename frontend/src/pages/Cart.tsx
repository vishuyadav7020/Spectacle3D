import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import { CheckoutSteps } from "../components/ui/CheckoutSteps";
import { useCart } from "../context/CartContext";

const SHIPPING = 5;
const TAX_RATE = 0.08;

export function Cart() {
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const shipping = items.length > 0 ? SHIPPING : 0;
  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + shipping + tax;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="px-6 py-12 md:px-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Your Cart
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          {items.length} item{items.length !== 1 ? "s" : ""} in your cart
        </p>

        <div className="mt-8">
          <CheckoutSteps current={0} />
        </div>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <p className="font-body text-text-secondary">Your cart is empty.</p>
            <Link to="/shop">
              <Button variant="primary">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-body text-xs font-semibold uppercase text-accent-primary">
                      {item.material}
                    </p>
                    <p className="font-display text-base font-medium text-text-primary">
                      {item.name}
                    </p>
                    {item.color && (
                      <p className="font-body text-sm text-text-secondary">
                        Color: {item.color}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-border">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-body text-sm text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="w-20 text-right font-body text-base font-semibold text-text-primary">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>

                  <button
                    onClick={() => removeItem(item.key)}
                    aria-label="Remove item"
                    className="text-text-secondary hover:text-accent-warm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <Link
                to="/shop"
                className="mt-2 flex w-fit items-center gap-2 font-body text-sm text-accent-primary hover:underline"
              >
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>

            <div className="h-fit rounded-lg border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-medium text-text-primary">
                Order Summary
              </h2>

              <div className="mt-4 flex flex-col gap-2 font-body text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span>₹{shipping.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Estimated Tax</span>
                  <span>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-body text-base font-semibold text-text-primary">
                  Total
                </span>
                <span className="font-display text-xl font-bold text-text-primary">
                  ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <Button
                variant="primary"
                className="mt-6 flex w-full items-center justify-center gap-2"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
