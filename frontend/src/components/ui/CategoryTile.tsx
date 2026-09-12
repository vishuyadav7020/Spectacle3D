import { Link } from "react-router-dom";

export interface CategoryTileData {
  id: string;
  label: string;
  imageUrl?: string;
}

interface CategoryTileProps {
  category: CategoryTileData;
  count?: number;
}

export function CategoryTile({ category, count }: CategoryTileProps) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(category.label)}`}
      className="group flex w-full flex-col gap-2 text-left"
    >
      <div className="h-32 w-full overflow-hidden rounded-md bg-surface-2 transition-colors group-hover:bg-surface-2/80">
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.label}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <h3 className="font-body text-sm font-medium text-text-primary">
        {category.label}
      </h3>
      {count !== undefined && (
        <p className="font-body text-xs text-text-secondary">{count} items</p>
      )}
    </Link>
  );
}
