import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderPageClient from "./OrderPageClient";

export const metadata = {
  title: "Pre-Order | Danskys Pesach Lettuce",
  description:
    "Pre-order your kosher Pesach lettuce. Home delivery to NE postcodes or in-store pickup available.",
};

export default function OrderPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <OrderPageClient />
        <Footer />
      </div>
    </CartProvider>
  );
}
