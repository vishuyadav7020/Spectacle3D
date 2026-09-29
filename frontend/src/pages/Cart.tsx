import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Minus, Plus, Tag, Trash2, X } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import { CheckoutSteps } from "../components/ui/CheckoutSteps";
import { useCart } from "../context/CartContext";
import { validateCoupon } from "../lib/coupons";

const SHIPPING = 5;
const TAX_RATE = 0.08;

export function Cart() {
  const { items, itemCount, subtotal, loading, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = coupon?.discountAmount ?? 0;
  const shipping = items.length > 0 ? SHIPPING : 0;
  const taxableSubtotal = Math.max(subtotal - discount, 0);
  const tax = taxableSubtotal * TAX_RATE;
  const total = taxableSubtotal + shipping + tax;

  async function handleApplyCoupon(e: FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setApplyingCoupon(true);
    try {
      const result = await validateCoupon(couponInput.trim(), subtotal);
      setCoupon({ code: result.code, discountAmount: result.discount_amount });
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not apply this coupon.";
      setCouponError(message);
      setCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="px-6 py-12 md:px-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Your Cart
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
        </p>

        <div className="mt-8">
          <CheckoutSteps current={0} />
        </div>

        {loading && items.length === 0 ? (
          <p className="mt-16 text-center font-body text-text-secondary">Loading your cart...</p>
        ) : items.length === 0 ? (
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
                  key={item.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    item.available ? "border-border bg-surface" : "border-accent-warm/40 bg-surface"
                  }`}
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name ?? ""}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    {item.material && (
                      <p className="font-body text-xs font-semibold uppercase text-accent-primary">
                        {item.material}
                      </p>
                    )}
                    <p className="font-display text-base font-medium text-text-primary">
                      {item.name ?? "Product no longer available"}
                    </p>
                    {item.color && (
                      <p className="font-body text-sm text-text-secondary">
                        Color: {item.color}
                      </p>
                    )}
                    {!item.available && (
                      <p className="mt-1 flex items-center gap-1.5 font-body text-xs text-accent-warm">
                        <AlertTriangle size={12} /> No longer available — remove to continue
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-border">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-body text-sm text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="w-20 text-right font-body text-base font-semibold text-text-primary">
                    {item.subtotal != null ? `₹${item.subtotal.toLocaleString("en-IN")}` : "—"}
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
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

              {coupon ? (
                <div className="mt-4 flex items-center justify-between rounded-md border border-accent-primary/40 bg-accent-primary/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 font-body text-sm text-accent-primary">
                    <Tag size={14} /> {coupon.code} applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    aria-label="Remove coupon"
                    className="text-text-secondary hover:text-accent-warm"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Promo code"
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 font-body text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={applyingCoupon}
                    className="!px-4 !py-2 text-sm disabled:opacity-60"
                  >
                    {applyingCoupon ? "..." : "Apply"}
                  </Button>
                </form>
              )}
              {couponError && (
                <p className="mt-2 font-body text-xs text-accent-warm">{couponError}</p>
              )}

              <div className="mt-4 flex flex-col gap-2 font-body text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent-primary">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
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
                onClick={() =>
                  navigate("/checkout", coupon ? { state: { couponCode: coupon.code } } : undefined)
                }
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
