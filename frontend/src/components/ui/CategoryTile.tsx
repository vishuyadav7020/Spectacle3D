import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface CategoryTileData {
  id: string;
  label: string;
  imageUrl?: string;
  icon?: LucideIcon;
}

interface CategoryTileProps {
  category: CategoryTileData;
  count?: number;
  index?: number;
}

const GRADIENTS = [
  "from-accent-primary/25 to-accent-primary/5",
  "from-accent-secondary/25 to-accent-secondary/5",
  "from-accent-warm/25 to-accent-warm/5",
];

const ICON_COLORS = ["text-accent-primary", "text-accent-secondary", "text-accent-warm"];

export function CategoryTile({ category, count, index = 0 }: CategoryTileProps) {
  const Icon = category.icon;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];

  return (
    <Link
      to={`/shop?category=${encodeURIComponent(category.label)}`}
      className="group flex w-full flex-col gap-2 text-left"
    >
      <div
        className={`relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${gradient} shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/5`}
      >
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.label}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          Icon && (
            <Icon
              size={36}
              strokeWidth={1.5}
              className={`${iconColor} transition-transform duration-300 group-hover:scale-110`}
            />
          )
        )}
      </div>
      <h3 className="font-body text-sm font-medium text-text-primary transition-colors group-hover:text-accent-primary">
        {category.label}
      </h3>
      {count !== undefined && (
        <p className="font-body text-xs text-text-secondary">{count} items</p>
      )}
    </Link>
  );
}
