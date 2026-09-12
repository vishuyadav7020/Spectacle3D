import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MENU_ITEMS = [
  { label: "My Account", to: "/account" },
  { label: "My Cart", to: "/cart" },
  { label: "My Orders", to: "/orders" },
];

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    // Navigate before clearing auth state — otherwise ProtectedRoute's own
    // redirect-to-/signin fires first (since the current route still matches
    // for an instant) and wins the race against this navigate("/") call.
    navigate("/");
    await logout();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-primary transition-colors hover:border-accent-primary/60"
      >
        <User size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <p className="border-b border-border px-4 py-3 font-body text-sm text-text-secondary">
            Hi, {user?.full_name.split(" ")[0]}
          </p>
          {MENU_ITEMS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 font-body text-sm text-text-primary transition-colors hover:bg-surface-2 hover:text-accent-primary"
            >
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-3 font-body text-sm font-medium text-accent-secondary transition-colors hover:bg-surface-2"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full px-4 py-3 text-left font-body text-sm text-accent-warm transition-colors hover:bg-surface-2"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
