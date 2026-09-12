import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { Button } from "./Button";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../lib/products";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const price = product.discount_price ?? product.base_price;
  const onSale = product.discount_price != null;
  const imageUrl = product.images[0];

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl,
      material: product.material ?? product.print_technology,
      price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="group flex w-full flex-col gap-2 rounded-lg bg-surface p-3">
      <Link to={`/products/${product.id}`} className="relative block">
        <div className="aspect-square w-full overflow-hidden rounded-md bg-surface-2">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {onSale && (
          <span className="absolute left-2 top-2 rounded-sm bg-accent-warm px-2 py-0.5 font-body text-[11px] font-semibold uppercase text-bg">
            Sale
          </span>
        )}

        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/60 text-text-primary backdrop-blur-sm transition-colors hover:text-accent-warm"
        >
          <Heart size={16} />
        </button>

        <Button
          variant="primary"
          className="absolute bottom-2 left-1/2 w-[calc(100%-1rem)] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleAddToCart}
        >
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
      </Link>

      <p className="mt-1 font-body text-xs font-semibold uppercase tracking-wide text-accent-primary">
        {product.category}
      </p>

      <Link to={`/products/${product.id}`}>
        <h3 className="font-display text-base font-medium text-text-primary hover:text-accent-primary">
          {product.name}
        </h3>
      </Link>

      {product.rating_count > 0 && (
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-rating text-rating" />
          <span className="font-body text-xs text-text-secondary">
            {product.rating_avg.toFixed(1)} ({product.rating_count})
          </span>
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className="font-body text-base font-semibold text-text-primary">
          ₹{price.toLocaleString("en-IN")}
        </span>
        {onSale && (
          <span className="font-body text-sm text-text-secondary line-through">
            ₹{product.base_price.toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}
