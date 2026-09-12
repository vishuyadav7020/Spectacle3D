import type { CategoryTileData } from "../components/ui/CategoryTile";

// Categories aren't backed by an API (products.category is a free-text field,
// not a separate collection) — this is a fixed taxonomy for the homepage grid.
export const CATEGORIES: CategoryTileData[] = [
  { id: "miniatures", label: "Miniatures" },
  { id: "home-decor", label: "Home Decor" },
  { id: "cosplay-props", label: "Cosplay Props" },
  { id: "functional-parts", label: "Functional Parts" },
  { id: "gifts", label: "Gifts" },
];
