import { Truck, ShieldCheck, Wrench, Lock } from "lucide-react";

const VALUES = [
  { icon: Truck, title: "Free Shipping", description: "On orders over $50" },
  { icon: ShieldCheck, title: "Premium Materials", description: "PLA & resin quality" },
  { icon: Wrench, title: "Custom Designs", description: "Tailored to you" },
  { icon: Lock, title: "Secure Checkout", description: "Encrypted payments" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface px-6 py-6 md:px-16">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {VALUES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon size={20} className="shrink-0 text-accent-primary" />
            <div>
              <p className="font-body text-sm font-medium text-text-primary">
                {title}
              </p>
              <p className="font-body text-xs text-text-secondary">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
