export const dynamic = "force-dynamic";

import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import BentoGrid from "@/components/home/BentoGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";

export default function HomePage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>
          <HeroSection />
          <BentoGrid />
          <FeaturedProducts />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
