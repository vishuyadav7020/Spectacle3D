import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ProductCard } from "../components/ui/ProductCard";
import { type Product, listProducts } from "../lib/products";

const PAGE_SIZE = 12;

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setLoading(true);
    listProducts({
      category: category || undefined,
      search: search || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((data) => {
        setProducts(data.results);
        setCount(data.count);
      })
      .catch(() => {
        setProducts([]);
        setCount(0);
      })
      .finally(() => setLoading(false));
  }, [category, search, page]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in next)) params.delete("page");
    setSearchParams(params);
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-bg">
      <Navbar cartCount={0} />

      <main className="px-6 py-12 md:px-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {category ? category : "All Products"}
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ search: searchInput });
            }}
            className="flex gap-2"
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="rounded-md border border-border bg-surface px-4 py-2 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-accent-primary px-4 py-2 font-body text-sm font-semibold text-bg"
            >
              Search
            </button>
          </form>
        </div>

        {category && (
          <button
            onClick={() => updateParams({ category: "" })}
            className="mt-3 font-body text-sm text-accent-primary hover:underline"
          >
            × Clear category filter
          </button>
        )}

        {loading && (
          <p className="mt-8 font-body text-sm text-text-secondary">
            Loading...
          </p>
        )}

        {!loading && products.length === 0 && (
          <p className="mt-8 font-body text-sm text-text-secondary">
            No products found.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="font-body text-sm text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
            >
              Previous
            </button>
            <span className="font-body text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="font-body text-sm text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
            >
              Next
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
