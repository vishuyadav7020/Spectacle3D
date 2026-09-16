import { Link } from "react-router-dom";
import { Box, Sparkles, Truck } from "lucide-react";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 top-16 h-72 w-72 rounded-full bg-accent-secondary/15 blur-[100px]" />

      <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-16 md:py-24">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 font-body text-xs font-semibold text-accent-primary">
            <Sparkles size={12} /> Precision 3D Printing
          </span>

          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-text-primary md:text-5xl md:leading-[1.1]">
            Custom 3D Printed Products for{" "}
            <span className="text-accent-primary">Every</span> Part of Your Life
          </h1>

          <p className="mt-5 max-w-md font-body text-base text-text-secondary">
            From home decor to car accessories, toys to tech gadgets — browse
            our full catalog of precision-made 3D printed goods, ready to ship
            worldwide.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/shop">
              <Button variant="primary">Shop Now</Button>
            </Link>
            <Link to="/shop">
              <Button variant="secondary">Explore Categories</Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-br from-surface-2 via-surface-2 to-accent-primary/15 shadow-2xl shadow-accent-primary/10">
            <Box size={120} strokeWidth={1} className="text-accent-primary/25" />
          </div>

          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-bg/85 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-sm">
            <Box size={16} className="text-accent-secondary" />
            <div>
              <p className="font-body text-xs font-semibold text-text-primary">
                Made to Order
              </p>
              <p className="font-body text-[10px] text-text-secondary">
                Custom designs
              </p>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-bg/85 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-sm">
            <Truck size={16} className="text-accent-primary" />
            <div>
              <p className="font-body text-xs font-semibold text-text-primary">
                Fast Shipping
              </p>
              <p className="font-body text-[10px] text-text-secondary">
                Worldwide delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
