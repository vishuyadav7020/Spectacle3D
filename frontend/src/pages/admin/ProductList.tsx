import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  type Product,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../../lib/products";
import { CATEGORIES } from "../../data/categories";

const STATUS_OPTIONS = ["all", "draft", "published", "archived"] as const;
const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 5;

export function ProductListPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [count, setCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await listProducts({
        status: statusFilter === "all" ? undefined : statusFilter,
        category: categoryFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setProducts(data.results);
      setCount(data.count);
    } catch {
      setError("Could not load products.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, page]);

  async function handleTogglePublish(product: Product) {
    const nextStatus = product.status === "published" ? "draft" : "published";
    try {
      await updateProduct(product.id, { status: nextStatus });
      await load();
    } catch {
      setError("Could not update product status.");
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      await load();
    } catch {
      setError("Could not delete product.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Products
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Manage your product catalog.
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number]);
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm capitalize text-text-primary focus:border-accent-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Status" : s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Product</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Category</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Price</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Stock</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Status</th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => {
              const lowStock = !product.is_made_to_order && product.stock_quantity <= LOW_STOCK_THRESHOLD;
              const outOfStock = !product.is_made_to_order && product.stock_quantity === 0;
              return (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-body text-sm text-text-primary">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-sm bg-accent-secondary/20 px-2 py-0.5 font-body text-xs text-accent-secondary">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-secondary">
                    ₹{product.base_price.toLocaleString("en-IN")}
                  </td>
                  <td className={`px-4 py-3 font-body text-sm ${lowStock ? "text-accent-warm" : "text-text-secondary"}`}>
                    {product.is_made_to_order ? "Made to order" : `${product.stock_quantity} units`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill px-2.5 py-1 font-body text-xs capitalize ${
                        outOfStock
                          ? "bg-accent-warm/20 text-accent-warm"
                          : product.status === "published"
                            ? "bg-success/20 text-success"
                            : product.status === "draft"
                              ? "bg-surface-2 text-text-secondary"
                              : "bg-accent-warm/20 text-accent-warm"
                      }`}
                    >
                      {outOfStock ? "Out of Stock" : product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 font-body text-sm">
                      <button onClick={() => handleTogglePublish(product)} className="text-accent-primary hover:underline">
                        {product.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <Link to={`/admin/products/${product.id}`} className="text-text-secondary hover:text-text-primary">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(product)} className="text-accent-warm hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products && products.length === 0 && (
          <p className="px-4 py-8 text-center font-body text-sm text-text-secondary">
            No products found.
          </p>
        )}

        {products && products.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="font-body text-sm text-text-secondary">
              Showing <span className="text-text-primary">{(page - 1) * PAGE_SIZE + 1}-{(page - 1) * PAGE_SIZE + products.length}</span> of{" "}
              <span className="text-text-primary">{count}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-body text-sm text-text-primary">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
