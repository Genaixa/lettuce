import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin | Danskys Pesach Lettuce",
};

export default function AdminPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <AdminClient />
        <Footer />
      </div>
    </CartProvider>
  );
}
