import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "My Account | Danskys Pesach Lettuce",
};

export default function MyAccountPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <AccountClient />
        <Footer />
      </div>
    </CartProvider>
  );
}
