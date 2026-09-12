import { Link } from "react-router-dom";
import { Box, Truck } from "lucide-react";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="grid grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-16 md:py-24">
      <div>
        <h1 className="font-display text-4xl font-bold leading-tight text-text-primary md:text-5xl md:leading-[1.1]">
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
        <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-surface-2 via-surface-2 to-accent-primary/10" />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-bg/80 px-3 py-2 backdrop-blur-sm">
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

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-bg/80 px-3 py-2 backdrop-blur-sm">
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
    </section>
  );
}
