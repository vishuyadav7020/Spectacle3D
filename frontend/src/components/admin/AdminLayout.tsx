import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, Receipt, Users } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/users", label: "Users", icon: Users },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    navigate("/");
    await logout();
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-64 flex-col border-r border-border px-4 py-6">
        <Link
          to="/"
          className="mb-8 px-2 font-display text-xl font-bold text-text-primary"
        >
          Spectacle<span className="text-accent-primary">3D</span>
        </Link>

        <p className="px-2 font-body text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Main
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm transition-colors",
                  isActive
                    ? "bg-surface-2 text-accent-primary"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <div className="px-2">
            <p className="font-body text-xs text-text-secondary">Signed in as</p>
            <p className="font-body text-sm text-text-primary">{user?.full_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-accent-warm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
