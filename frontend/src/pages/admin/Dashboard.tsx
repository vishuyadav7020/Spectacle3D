import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileEdit, Package } from "lucide-react";
import { type Product, listProducts } from "../../lib/products";
import { CATEGORIES } from "../../data/categories";

const LOW_STOCK_THRESHOLD = 5;

export function AdminDashboard() {
  const [total, setTotal] = useState<number | null>(null);
  const [published, setPublished] = useState<number | null>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    listProducts({ page_size: 1 }).then((data) => setTotal(data.count));
    listProducts({ status: "published", page_size: 1 }).then((data) => setPublished(data.count));
    listProducts({ status: "draft", page_size: 1 }).then((data) => setDraft(data.count));

    CATEGORIES.forEach((c) => {
      listProducts({ category: c.label, page_size: 1 }).then((data) =>
        setCategoryCounts((prev) => ({ ...prev, [c.label]: data.count })),
      );
    });

    // Low stock is computed from real stock_quantity — made-to-order items
    // don't hold fixed stock, so they're excluded.
    listProducts({ page_size: 100 }).then((data) => {
      setLowStock(
        data.results
          .filter((p) => !p.is_made_to_order && p.stock_quantity <= LOW_STOCK_THRESHOLD)
          .slice(0, 5),
      );
    });
  }, []);

  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary">
        Dashboard
      </h1>
      <p className="mt-2 font-body text-sm text-text-secondary">
        Here's what's happening with your store today.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Package} label="Total Products" value={total} />
        <StatCard icon={CheckCircle2} label="Published" value={published} accent="text-success" />
        <StatCard icon={FileEdit} label="Drafts" value={draft} accent="text-text-secondary" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-text-primary">
            Products by Category
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {CATEGORIES.map((c) => {
              const count = categoryCounts[c.label] ?? 0;
              return (
                <div key={c.id}>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-text-secondary">{c.label}</span>
                    <span className="text-text-primary">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-surface-2">
                    <div
                      className="h-full rounded-pill bg-accent-primary"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-text-primary">
              Low Stock
            </h2>
            {lowStock.length > 0 && (
              <span className="font-body text-sm text-accent-warm">{lowStock.length} items</span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <p className="mt-6 font-body text-sm text-text-secondary">
              No products are running low on stock.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-accent-warm" />
                    <div>
                      <p className="font-body text-sm text-text-primary">{p.name}</p>
                      <p className="font-body text-xs text-accent-warm">
                        {p.stock_quantity} left
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="font-body text-sm text-accent-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "text-accent-primary",
}: {
  icon: typeof Package;
  label: string;
  value: number | null;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <Icon size={20} className={accent} />
      <p className="mt-4 font-display text-2xl font-bold text-text-primary">
        {value ?? "—"}
      </p>
      <p className="font-body text-sm text-text-secondary">{label}</p>
    </div>
  );
}
