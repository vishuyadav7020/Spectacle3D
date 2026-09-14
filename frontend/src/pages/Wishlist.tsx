import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ProductCard } from "../components/ui/ProductCard";
import { useWishlist } from "../context/WishlistContext";

export function Wishlist() {
  const { items, loading } = useWishlist();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="px-6 py-12 md:px-16">
        <h1 className="font-display text-3xl font-bold text-text-primary">
          My Wishlist
        </h1>

        {loading && (
          <p className="mt-8 font-body text-sm text-text-secondary">Loading...</p>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <Heart size={40} className="text-text-secondary" />
            <p className="font-body text-sm text-text-secondary">
              You haven't saved anything yet.
            </p>
            <Link to="/shop" className="font-body text-sm text-accent-primary hover:underline">
              Start Shopping
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
