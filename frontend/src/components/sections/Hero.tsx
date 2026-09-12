import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 px-6 py-16 text-center md:px-16 md:py-24">
      <p className="font-body text-xs font-medium tracking-[0.2em] text-accent-secondary">
        PRECISION 3D PRINTING
      </p>

      <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight text-text-primary md:text-6xl md:leading-[1.1]">
        Bring Your Ideas to Life in 3D
      </h1>

      <p className="max-w-xl font-body text-base text-text-secondary md:text-lg">
        Custom 3D printed miniatures, decor, cosplay props, and functional
        parts — designed, printed, and shipped by us.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/shop">
          <Button variant="primary">Shop Now</Button>
        </Link>
        <Link to="/shop">
          <Button variant="secondary">Explore Categories</Button>
        </Link>
      </div>

      <div className="mt-4 h-64 w-full max-w-5xl rounded-lg bg-gradient-to-br from-surface-2 via-surface-2 to-accent-secondary/10 md:h-[420px]" />
    </section>
  );
}
