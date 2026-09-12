import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ProductCard } from "../components/ui/ProductCard";
import { type Product, listProducts } from "../lib/products";
import { CATEGORIES } from "../data/categories";

const PAGE_SIZE = 12;
const MATERIALS = ["PLA", "ABS", "PETG", "Resin", "Nylon", "TPU"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A-Z" },
];

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const material = searchParams.get("material") ?? "";
  const search = searchParams.get("search") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? "1");

  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    listProducts({
      category: category || undefined,
      material: material || undefined,
      search: search || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
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
  }, [category, material, search, minPrice, maxPrice, page]);

  useEffect(() => {
    listProducts({ page_size: 1 }).then((data) =>
      setCategoryCounts((prev) => ({ ...prev, __all: data.count })),
    );
    CATEGORIES.forEach((c) => {
      listProducts({ category: c.label, page_size: 1 }).then((data) =>
        setCategoryCounts((prev) => ({ ...prev, [c.label]: data.count })),
      );
    });
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sort) {
      case "price_asc":
        return list.sort((a, b) => (a.discount_price ?? a.base_price) - (b.discount_price ?? b.base_price));
      case "price_desc":
        return list.sort((a, b) => (b.discount_price ?? b.base_price) - (a.discount_price ?? a.base_price));
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, sort]);

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
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="px-6 py-8 md:px-16">
        <nav className="font-body text-sm text-text-secondary">
          <Link to="/" className="hover:text-text-primary">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-text-primary">{category || "Shop"}</span>
        </nav>

        <h1 className="mt-3 font-display text-3xl font-bold text-text-primary">
          {category || "All Products"}
        </h1>
        <p className="mt-2 font-body text-sm text-text-secondary">
          Browse our full catalog of 3D printed goods across every category.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="flex flex-col gap-8">
            <div>
              <h3 className="font-body text-sm font-semibold text-text-primary">Categories</h3>
              <div className="mt-3 flex flex-col gap-2">
                <FilterCheckbox
                  label="All Products"
                  count={categoryCounts.__all}
                  checked={!category}
                  onChange={() => updateParams({ category: "" })}
                />
                {CATEGORIES.map((c) => (
                  <FilterCheckbox
                    key={c.id}
                    label={c.label}
                    count={categoryCounts[c.label]}
                    checked={category === c.label}
                    onChange={() => updateParams({ category: category === c.label ? "" : c.label })}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-body text-sm font-semibold text-text-primary">Price Range</h3>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateParams({ min_price: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
                <span className="text-text-secondary">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateParams({ max_price: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <h3 className="font-body text-sm font-semibold text-text-primary">Material</h3>
              <div className="mt-3 flex flex-col gap-2">
                {MATERIALS.map((m) => (
                  <FilterCheckbox
                    key={m}
                    label={m}
                    checked={material === m}
                    onChange={() => updateParams({ material: material === m ? "" : m })}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setSearchParams({})}
              className="rounded-md border border-border py-2 font-body text-sm text-text-secondary hover:text-text-primary"
            >
              Clear Filters
            </button>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-body text-sm text-text-secondary">
                Showing <span className="text-text-primary">{products.length}</span> of{" "}
                <span className="text-text-primary">{count}</span> products
              </p>

              <div className="flex items-center gap-3">
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
                    className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="flex items-center justify-center rounded-md border border-border px-3 text-text-secondary hover:text-text-primary"
                  >
                    <Search size={16} />
                  </button>
                </form>

                <select
                  value={sort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-text-primary focus:border-accent-primary focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <p className="mt-8 font-body text-sm text-text-secondary">Loading...</p>
            )}

            {!loading && products.length === 0 && (
              <p className="mt-8 font-body text-sm text-text-secondary">No products found.</p>
            )}

            {!loading && products.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
                >
                  <ChevronLeft size={16} />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => updateParams({ page: String(n) })}
                    className={`flex h-8 w-8 items-center justify-center rounded-md font-body text-sm ${
                      n === page
                        ? "bg-accent-primary text-bg"
                        : "border border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary disabled:opacity-40 enabled:hover:text-text-primary"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between font-body text-sm text-text-secondary hover:text-text-primary">
      <span className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onChange} />
        {label}
      </span>
      {count !== undefined && <span className="text-xs">{count}</span>}
    </label>
  );
}
