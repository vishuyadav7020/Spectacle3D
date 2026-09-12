import { type FormEvent, useState } from "react";
import { Heart, Search, ShoppingCart, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const NAV_LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/shop" },
  { label: "Best Sellers", to: "/shop" },
  { label: "About", to: "#" },
];

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const wishlistCount = user?.wishlist.length ?? 0;

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="border-b border-border">
      <nav className="flex items-center gap-6 px-6 py-4 md:px-16">
        <Link
          to="/"
          className="shrink-0 font-display text-2xl font-bold text-text-primary"
        >
          Spectacle<span className="text-accent-primary">3D</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="font-body text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 sm:block">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          {isAuthenticated && (
            <button
              type="button"
              aria-label="Wishlist"
              className="relative flex items-center text-text-primary"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-warm text-[10px] font-semibold text-bg">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          <Link to="/cart" aria-label="Cart" className="relative flex items-center text-text-primary">
            <ShoppingCart size={20} />
            {totalCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-warm text-[10px] font-semibold text-bg">
                {totalCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link
              to="/signin"
              aria-label="Sign in"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-primary transition-colors hover:border-accent-primary/60"
            >
              <User size={18} />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
