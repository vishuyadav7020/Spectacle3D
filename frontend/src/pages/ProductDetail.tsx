import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Minus, Plus, Star } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { useCart } from "../context/CartContext";
import { type Product, type Variant, getProduct, listProducts } from "../lib/products";

const TABS = ["Description", "Specifications", "Shipping & Returns"] as const;

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setActiveImage(0);
    setQuantity(1);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        setSelectedVariant(p.variants.find((v) => v.is_active) ?? null);
        listProducts({ category: p.category, page_size: 5 }).then((data) =>
          setRelated(data.results.filter((r) => r.id !== p.id).slice(0, 4)),
        );
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar />
        <main className="px-6 py-24 text-center md:px-16">
          <p className="font-body text-text-secondary">
            This product doesn't exist or isn't available.
          </p>
          <Link to="/shop" className="mt-4 inline-block font-body text-accent-primary hover:underline">
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
        <Navbar />
        <p className="px-6 py-24 text-center font-body text-text-secondary md:px-16">Loading...</p>
        <Footer />
      </div>
    );
  }

  const price = selectedVariant?.price ?? product.discount_price ?? product.base_price;
  const originalPrice = !selectedVariant && product.discount_price ? product.base_price : null;
  const activeVariants = product.variants.filter((v) => v.is_active);
  const images = product.images.length > 0 ? product.images : [undefined];

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      imageUrl: product.images[0],
      material: selectedVariant?.material ?? product.material ?? product.print_technology,
      color: selectedVariant?.color,
      price,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="px-6 py-8 md:px-16">
        <nav className="font-body text-sm text-text-secondary">
          <Link to="/" className="hover:text-text-primary">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/shop" className="hover:text-text-primary">Shop</Link>
          <span className="mx-2">›</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-text-primary">
            {product.category}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface-2">
              {images[activeImage] && (
                <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square overflow-hidden rounded-md border-2 bg-surface-2 ${
                      i === activeImage ? "border-accent-primary" : "border-transparent"
                    }`}
                  >
                    {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-accent-primary">
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">
              {product.name}
            </h1>

            {product.rating_count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(product.rating_avg) ? "fill-rating text-rating" : "text-border"}
                    />
                  ))}
                </div>
                <span className="font-body text-sm text-text-secondary">
                  {product.rating_avg.toFixed(1)} ({product.rating_count} reviews)
                </span>
                <span className="flex items-center gap-1 font-body text-sm text-success">
                  <CheckCircle2 size={14} /> In Stock
                </span>
              </div>
            )}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-2xl font-bold text-text-primary">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {originalPrice && (
                <span className="font-body text-base text-text-secondary line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <p className="mt-6 font-body text-base text-text-secondary">{product.description}</p>

            {activeVariants.length > 0 && (
              <div className="mt-6">
                <p className="font-body text-sm font-medium text-text-secondary">Material / Color</p>
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

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-md border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-text-secondary hover:text-text-primary"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-body text-sm text-text-primary">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-10 w-10 items-center justify-center text-text-secondary hover:text-text-primary"
                >
                  <Plus size={14} />
                </button>
              </div>
              <Button variant="primary" className="flex-1" onClick={handleAddToCart}>
                {added ? "Added to Cart ✓" : "Add to Cart"}
              </Button>
            </div>

            <div className="mt-8 border-t border-border">
              <div className="flex gap-6">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`-mb-px border-b-2 py-3 font-body text-sm ${
                      tab === t
                        ? "border-accent-primary text-accent-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="py-6 font-body text-sm text-text-secondary">
                {tab === "Description" && <p>{product.description}</p>}
                {tab === "Specifications" && (
                  <div className="flex flex-col gap-2">
                    <SpecRow label="Print technology" value={product.print_technology} />
                    {product.material && <SpecRow label="Material" value={product.material} />}
                    {product.scale && <SpecRow label="Scale" value={product.scale} />}
                    {product.weight_grams && <SpecRow label="Weight" value={`${product.weight_grams} g`} />}
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
                )}
                {tab === "Shipping & Returns" && (
                  <p>
                    Standard shipping takes 5-7 business days. Express shipping
                    (2-3 days) is available at checkout. Returns are accepted
                    within 30 days of delivery for unused items.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-text-primary">
              You May Also Like
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2">
      <span>{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
