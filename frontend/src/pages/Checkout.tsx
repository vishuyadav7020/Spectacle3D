import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { CheckoutSteps } from "../components/ui/CheckoutSteps";
import { useCart } from "../context/CartContext";
import type { OrderSummary } from "./OrderConfirmation";

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard Shipping (5-7 days)", price: 5 },
  { id: "express", label: "Express Shipping (2-3 days)", price: 14 },
];

const TAX_RATE = 0.08;

export function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [apt, setApt] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [cardNumber, setCardNumber] = useState("");

  const shipping = SHIPPING_OPTIONS.find((s) => s.id === shippingMethod)!.price;
  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <main className="px-6 py-24 text-center md:px-16">
          <p className="font-body text-text-secondary">Your cart is empty.</p>
          <Link to="/shop" className="mt-4 inline-block font-body text-accent-primary hover:underline">
            Go to Shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();

    // No payment gateway or orders backend exists yet — this simulates a
    // successful order locally. Card details never leave this component.
    const order: OrderSummary = {
      orderNumber: `SPD-${Math.floor(10000 + Math.random() * 90000)}`,
      orderDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      items,
      subtotal: totalPrice,
      shipping,
      tax,
      total,
      shippingAddress: { firstName, lastName, street, apt, city, state, zip, country },
      cardLast4: cardNumber.slice(-4) || "0000",
    };

    clearCart();
    navigate("/order-confirmation", { state: order });
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-16">
        <Link to="/" className="font-display text-2xl font-bold text-text-primary">
          Spectacle<span className="text-accent-primary">3D</span>
        </Link>
        <div className="flex items-center gap-2 font-body text-sm text-text-secondary">
          <Lock size={14} /> Secure Checkout
        </div>
      </header>

      <main className="px-6 py-12 md:px-16">
        <div className="mb-10">
          <CheckoutSteps current={1} />
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <section className="rounded-lg border border-border bg-surface p-6">
              <SectionTitle step={1} title="Contact Information" />
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  label="Email address"
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Phone number"
                  type="tel"
                  name="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6">
              <SectionTitle step={2} title="Shipping Address" />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Input label="First name" name="first_name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last name" name="last_name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <div className="col-span-2">
                  <Input label="Street address" name="street" required value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Input label="Apartment, suite, etc. (optional)" name="apt" value={apt} onChange={(e) => setApt(e.target.value)} />
                </div>
                <Input label="City" name="city" required value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="State / Province" name="state" required value={state} onChange={(e) => setState(e.target.value)} />
                <Input label="ZIP / Postal code" name="zip" required value={zip} onChange={(e) => setZip(e.target.value)} />
                <Input label="Country" name="country" required value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6">
              <SectionTitle step={3} title="Shipping Method" />
              <div className="mt-4 flex flex-col gap-3">
                {SHIPPING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 font-body text-sm transition-colors ${
                      shippingMethod === option.id
                        ? "border-accent-primary text-text-primary"
                        : "border-border text-text-secondary"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping_method"
                        checked={shippingMethod === option.id}
                        onChange={() => setShippingMethod(option.id)}
                      />
                      {option.label}
                    </span>
                    <span>₹{option.price.toLocaleString("en-IN")}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6">
              <SectionTitle step={4} title="Payment" />
              <div className="mt-4 flex flex-col gap-4">
                <Input
                  label="Card number"
                  name="card_number"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                />
                <Input label="Name on card" name="card_name" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="MM / YY" name="card_expiry" required placeholder="MM/YY" />
                  <Input label="CVC" name="card_cvc" required maxLength={4} />
                </div>
                <p className="font-body text-xs text-text-secondary">
                  This is a demo checkout — no real payment is processed and
                  card details are never sent anywhere.
                </p>
              </div>
            </section>

            <Link to="/cart" className="flex w-fit items-center gap-2 font-body text-sm text-accent-primary hover:underline">
              <ArrowLeft size={16} /> Back to Cart
            </Link>
          </div>

          <div className="h-fit rounded-lg border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-medium text-text-primary">
              Order Summary
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
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
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 font-body text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{shipping.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-body text-base font-semibold text-text-primary">Total</span>
              <span className="font-display text-xl font-bold text-text-primary">
                ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>

            <Button type="submit" variant="primary" className="mt-6 flex w-full items-center justify-center gap-2">
              <Lock size={16} /> Place Order
            </Button>
            <p className="mt-3 text-center font-body text-xs text-text-secondary">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-primary font-body text-xs font-semibold text-bg">
        {step}
      </span>
      <h2 className="font-display text-lg font-medium text-text-primary">{title}</h2>
    </div>
  );
}
