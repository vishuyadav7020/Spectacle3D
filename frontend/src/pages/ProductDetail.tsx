import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import { type Product, type Variant, getProduct } from "../lib/products";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setSelectedVariant(p.variants.find((v) => v.is_active) ?? null);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar cartCount={0} />
        <main className="px-6 py-24 text-center md:px-16">
          <p className="font-body text-text-secondary">
            This product doesn't exist or isn't available.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-block font-body text-accent-primary hover:underline"
          >
            Back to Shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar cartCount={0} />
        <p className="px-6 py-24 text-center font-body text-text-secondary md:px-16">
          Loading...
        </p>
        <Footer />
      </div>
    );
  }

  const price = selectedVariant?.price ?? product.discount_price ?? product.base_price;
  const originalPrice = product.discount_price ? product.base_price : null;
  const activeVariants = product.variants.filter((v) => v.is_active);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar cartCount={0} />

      <main className="grid grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:px-16">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface-2">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div>
          <p className="font-body text-xs font-medium tracking-wide text-text-secondary">
            {product.material ?? product.print_technology} · {product.category}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-2xl font-bold text-accent-warm">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {originalPrice && (
              <span className="font-body text-base text-text-secondary line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <p className="mt-6 font-body text-base text-text-secondary">
            {product.description}
          </p>

          {activeVariants.length > 0 && (
            <div className="mt-6">
              <p className="font-body text-sm font-medium text-text-secondary">
                Material / Color
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-pill border px-4 py-2 font-body text-sm transition-colors ${
                      selectedVariant?.id === variant.id
                        ? "border-accent-primary text-accent-primary"
                        : "border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {variant.material} · {variant.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-1 rounded-md border border-border bg-surface p-4">
            <SpecRow label="Print technology" value={product.print_technology} />
            {product.scale && <SpecRow label="Scale" value={product.scale} />}
            {product.weight_grams && (
              <SpecRow label="Weight" value={`${product.weight_grams} g`} />
            )}
            {product.dimensions && (
              <SpecRow
                label="Dimensions"
                value={`${product.dimensions.length_mm} × ${product.dimensions.width_mm} × ${product.dimensions.height_mm} mm`}
              />
            )}
            <SpecRow
              label="Fulfillment"
              value={product.is_made_to_order ? "Made to order" : "Ships from stock"}
            />
          </div>

          <Button variant="primary" className="mt-8 w-full">
            Add to Cart
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 font-body text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
