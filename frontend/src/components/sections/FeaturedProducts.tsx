import { useEffect, useState } from "react";
import { ProductCard } from "../ui/ProductCard";
import { type Product, listProducts } from "../../lib/products";

const FILTERS = ["All", "Home Decor", "Car Accessories", "Toys & Figurines", "Gadgets & Tech"];

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    listProducts({
      category: filter === "All" ? undefined : filter,
      page_size: 8,
    })
      .then((data) => setProducts(data.results))
      .catch(() => setProducts([]));
  }, [filter]);

  if (products.length === 0 && filter === "All") return null;

  return (
    <section className="px-6 py-16 md:px-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-text-primary">
            Featured Products
          </h2>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Our most popular 3D printed creations, crafted with care.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-pill px-4 py-1.5 font-body text-sm transition-colors ${
                filter === f
                  ? "bg-accent-primary text-bg"
                  : "border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-8 font-body text-sm text-text-secondary">
          No products in this category yet.
        </p>
      )}
    </section>
  );
}
