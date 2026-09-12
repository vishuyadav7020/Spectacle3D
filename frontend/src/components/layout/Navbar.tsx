import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/shop" },
  { label: "Custom Orders", to: "#" },
  { label: "About", to: "#" },
];

interface NavbarProps {
  cartCount?: number;
}

export function Navbar({ cartCount = 0 }: NavbarProps) {
  const { user, isAuthenticated } = useAuth();
  const wishlistCount = user?.wishlist.length ?? 0;

  return (
    <header className="border-b border-border">
      <nav className="flex items-center justify-between px-6 py-5 md:px-16">
        <Link
          to="/"
          className="font-display text-2xl font-bold text-accent-primary"
        >
          Spectacle3D
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="font-body text-base text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
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

          <button
            type="button"
            aria-label="Cart"
            className="flex items-center gap-2 font-body text-base text-text-primary"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">({cartCount})</span>
          </button>

          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link to="/signin">
              <Button variant="primary">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
