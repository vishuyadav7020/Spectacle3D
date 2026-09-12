import { Link } from "react-router-dom";
import { Button } from "./Button";
import type { Product } from "../../lib/products";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = product.discount_price ?? product.base_price;
  const imageUrl = product.images[0];

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg bg-surface p-4">
      <Link to={`/products/${product.id}`} className="flex flex-col gap-3">
        <div className="aspect-square w-full overflow-hidden rounded-md bg-surface-2">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <p className="font-body text-xs font-medium tracking-wide text-text-secondary">
          {product.material ?? product.print_technology} · {product.category}
        </p>

        <h3 className="font-display text-xl font-medium text-text-primary">
          {product.name}
        </h3>

        <p className="font-body text-base text-accent-warm">
          ₹{price.toLocaleString("en-IN")}
        </p>
      </Link>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => onAddToCart?.(product)}
      >
        Add to Cart
      </Button>
    </div>
  );
}
