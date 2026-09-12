import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import {
  type Product,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../../lib/products";

const STATUS_FILTERS = ["all", "draft", "published", "archived"] as const;

export function ProductListPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await listProducts(
        statusFilter === "all" ? {} : { status: statusFilter },
      );
      setProducts(data.results);
    } catch {
      setError("Could not load products.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Products
          </h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            {products ? `${products.length} product(s)` : "Loading..."}
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            New Product
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-pill px-4 py-2 font-body text-sm capitalize transition-colors ${
              statusFilter === s
                ? "bg-accent-primary text-bg"
                : "border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 font-body text-sm text-accent-warm">{error}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Name
              </th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Category
              </th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Price
              </th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Stock
              </th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Status
              </th>
              <th className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-body text-sm text-text-primary">
                  {product.name}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {product.category}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  ₹{product.base_price.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 font-body text-sm text-text-secondary">
                  {product.stock_quantity}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 font-body text-xs capitalize ${
                      product.status === "published"
                        ? "bg-success/20 text-success"
                        : product.status === "draft"
                          ? "bg-surface-2 text-text-secondary"
                          : "bg-accent-warm/20 text-accent-warm"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 font-body text-sm">
                    <button
                      onClick={() => handleTogglePublish(product)}
                      className="text-accent-primary hover:underline"
                    >
                      {product.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-accent-warm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products && products.length === 0 && (
          <p className="px-4 py-8 text-center font-body text-sm text-text-secondary">
            No products found.
          </p>
        )}
      </div>
    </div>
  );
}
