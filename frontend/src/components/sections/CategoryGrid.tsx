import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CategoryTile, type CategoryTileData } from "../ui/CategoryTile";
import { listProducts } from "../../lib/products";

interface CategoryGridProps {
  categories: CategoryTileData[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(
      categories.map((c) =>
        listProducts({ category: c.label, page_size: 1 }).then((data) => [c.id, data.count] as const),
      ),
    ).then((results) => setCounts(Object.fromEntries(results)));
  }, [categories]);

  return (
    <section className="px-6 py-16 md:px-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-text-primary">
            Shop by Category
          </h2>
          <p className="mt-2 font-body text-sm text-text-secondary">
            Find exactly what you're looking for across our full catalog.
          </p>
        </div>
        <Link to="/shop" className="font-body text-sm text-accent-primary hover:underline">
          View All →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => (
          <CategoryTile key={category.id} category={category} count={counts[category.id]} />
        ))}
      </div>
    </section>
  );
}
