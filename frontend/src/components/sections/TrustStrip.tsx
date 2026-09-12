import { Palette, PackageCheck, Timer, Sparkles } from "lucide-react";

const VALUES = [
  {
    icon: PackageCheck,
    title: "Made to Order",
    description: "Every piece is printed fresh after you order — no warehouse stock.",
  },
  {
    icon: Sparkles,
    title: "Premium Materials",
    description: "PLA, PETG, Resin, and Nylon — matched to what your design needs.",
  },
  {
    icon: Timer,
    title: "Fast Turnaround",
    description: "Most orders print and ship within a few days.",
  },
  {
    icon: Palette,
    title: "Custom Colors",
    description: "Pick from a range of finishes and colors for most products.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface px-6 py-16 md:px-16">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3">
            <Icon size={28} className="text-accent-primary" />
            <h3 className="font-display text-lg font-medium text-text-primary">
              {title}
            </h3>
            <p className="font-body text-sm text-text-secondary">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
