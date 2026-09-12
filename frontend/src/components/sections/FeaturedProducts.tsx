import { ProductCard } from "../ui/ProductCard";
import type { Product } from "../../lib/products";

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
}

export function FeaturedProducts({
  products,
  onAddToCart,
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="px-6 py-16 md:px-16">
      <h2 className="mb-8 font-display text-3xl font-bold text-text-primary">
        Featured Products
      </h2>
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
