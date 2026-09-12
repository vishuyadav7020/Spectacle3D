import type { CategoryTileData } from "../components/ui/CategoryTile";

// Categories aren't backed by an API (products.category is a free-text field,
// not a separate collection) — this is a fixed taxonomy for the homepage grid.
// Matches the categories used in the UX Pilot "Spectacle3D" designs.
export const CATEGORIES: CategoryTileData[] = [
  { id: "home-decor", label: "Home Decor" },
  { id: "car-accessories", label: "Car Accessories" },
  { id: "toys-figurines", label: "Toys & Figurines" },
  { id: "gadgets-tech", label: "Gadgets & Tech" },
  { id: "wall-art", label: "Art & Wall Prints" },
];
