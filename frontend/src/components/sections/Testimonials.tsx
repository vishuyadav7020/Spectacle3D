import { Star } from "lucide-react";

// Placeholder testimonials from the UX Pilot mockup — replace with real
// customer reviews before launch.
const TESTIMONIALS = [
  {
    quote:
      "The geometric plant pot looks even better in person. Incredible detail and the finish is flawless. Fast shipping too!",
    name: "Sarah J.",
    rating: 5,
  },
  {
    quote:
      "Ordered a set of car accessories for my daily driver. They fit perfectly and hold up great. Will definitely order more.",
    name: "Marcus L.",
    rating: 4,
  },
  {
    quote:
      "My kids absolutely love the collectible figures. The colors are vibrant and the quality is far beyond what I expected.",
    name: "Emily C.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-16 md:px-16">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">
          Loved by Makers & Buyers
        </h2>
        <p className="mt-2 font-body text-sm text-text-secondary">
          See what customers say about our 3D printed products.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map(({ quote, name, rating }) => (
          <div key={name} className="rounded-lg border border-border bg-surface p-6">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < rating ? "fill-rating text-rating" : "text-border"}
                />
              ))}
            </div>
            <p className="mt-4 font-body text-sm text-text-secondary">"{quote}"</p>
            <p className="mt-4 font-body text-sm font-medium text-text-primary">
              {name}
            </p>
            <p className="font-body text-xs text-text-secondary">Verified Buyer</p>
          </div>
        ))}
      </div>
    </section>
  );
}
