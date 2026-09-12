import { useEffect, useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { CategoryGrid } from "../components/sections/CategoryGrid";
import { FeaturedProducts } from "../components/sections/FeaturedProducts";
import { TrustStrip } from "../components/sections/TrustStrip";
import { CATEGORIES } from "../data/categories";
import { type Product, listProducts } from "../lib/products";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    listProducts({ page_size: 8 })
      .then((data) => setProducts(data.results))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar cartCount={0} />
      <Hero />
      <CategoryGrid categories={CATEGORIES} />
      <FeaturedProducts products={products} />
      <TrustStrip />
      <Footer />
    </div>
  );
}
