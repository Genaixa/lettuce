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
        <div className="fixed top-3 right-4 z-50 text-[#1c3320]/40 text-sm font-medium select-none" dir="rtl">בס״ד</div>
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
