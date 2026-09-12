import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { TrustStrip } from "../components/sections/TrustStrip";
import { CategoryGrid } from "../components/sections/CategoryGrid";
import { FeaturedProducts } from "../components/sections/FeaturedProducts";
import { Newsletter } from "../components/sections/Newsletter";
import { Testimonials } from "../components/sections/Testimonials";
import { CATEGORIES } from "../data/categories";

export function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <TrustStrip />
      <CategoryGrid categories={CATEGORIES} />
      <FeaturedProducts />
      <Newsletter />
      <Testimonials />
      <Footer />
    </div>
  );
}
