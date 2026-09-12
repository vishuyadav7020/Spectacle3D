import { type FormEvent, useState } from "react";
import { Button } from "../ui/Button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // No backend endpoint for newsletter signups yet — UI only.
    setSubmitted(true);
  }

  return (
    <section className="px-6 py-16 md:px-16">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-surface-2 to-accent-primary/10 px-6 py-14 text-center">
        <span className="rounded-pill bg-accent-warm px-3 py-1 font-body text-xs font-semibold uppercase text-bg">
          Limited Offer
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold text-text-primary">
          Get 15% Off Your First Order
        </h2>
        <p className="mx-auto mt-3 max-w-md font-body text-sm text-text-secondary">
          Sign up for our newsletter and receive an exclusive discount code on
          any 3D printed product in our store.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 rounded-md border border-border bg-surface px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
          />
          <Button type="submit" variant="primary">
            {submitted ? "Subscribed ✓" : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
