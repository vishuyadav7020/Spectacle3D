import { Link } from "react-router-dom";
import { Package } from "lucide-react";

export function AdminDashboard() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Admin Dashboard
      </h1>
      <p className="mt-2 font-body text-sm text-text-secondary">
        Manage your Spectacle3D catalog.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/admin/products"
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent-primary/60"
        >
          <Package size={28} className="text-accent-primary" />
          <div>
            <p className="font-display text-lg font-medium text-text-primary">
              Products
            </p>
            <p className="font-body text-sm text-text-secondary">
              Create, edit, and publish products
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
