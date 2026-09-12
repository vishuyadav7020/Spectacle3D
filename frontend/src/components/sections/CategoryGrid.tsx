import { CategoryTile, type CategoryTileData } from "../ui/CategoryTile";

interface CategoryGridProps {
  categories: CategoryTileData[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="px-6 py-16 md:px-16">
      <h2 className="mb-8 font-display text-3xl font-bold text-text-primary">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category) => (
          <CategoryTile key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
