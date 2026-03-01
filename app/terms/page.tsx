import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms & Conditions | Danskys Pesach Lettuce",
};

export default function TermsPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">

            {/* Header */}
            <div className="text-center mb-14">
              <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
                Legal
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold text-[#1c3320] mb-4"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Terms &amp; Conditions
              </h1>
              <p className="text-[#1c3320]/60 max-w-xl mx-auto">
                Please read these terms before placing your order.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-6 text-[#1c3320]/60 text-sm leading-relaxed">

              <p>
                Whilst we endeavour to supply the highest quality products
                promptly, items are sourced from multiple locations worldwide.
                Factors such as logistics, weather conditions, or infestation
                may affect quality, availability, or delivery times.
              </p>

              <p>
                Danskys Gateshead Ltd cannot guarantee like-for-like
                replacements if products do not arrive as expected.
              </p>

              <p>
                If your chosen product becomes unavailable, a replacement from
                another variant cannot be guaranteed.
              </p>

              <p className="font-semibold text-[#1c3320]/80">
                All orders are final. Orders cannot be cancelled or amended
                once placed.
              </p>

              <section className="bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/40 rounded-xl p-6 transition-all">
                <h2
                  className="text-[#1c3320] font-semibold text-base mb-3 leading-snug"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Home Delivery
                </h2>
                <div className="space-y-3">
                  <p>
                    Danskys will endeavour to deliver your goods as soon
                    as they arrive, to maintain optimum freshness.
                  </p>
                  <p>
                    By placing an order, you confirm that your phone number is
                    correct and reachable for delivery communication.
                  </p>
                </div>
              </section>

              <section className="bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/40 rounded-xl p-6 transition-all">
                <h2
                  className="text-[#1c3320] font-semibold text-base mb-3 leading-snug"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Collection / Pick-Up
                </h2>
                <div className="space-y-3">
                  <p>
                    You will receive a text message the day before collection
                    with a 3-hour collection window and pickup details.
                  </p>
                  <p>
                    Orders not collected within the allocated time remain fully
                    chargeable, and the goods will be placed on sale in store.
                  </p>
                </div>
              </section>

              <div className="mt-12 text-center p-8 bg-[#f2faf3] border border-[#c5e0cc] rounded-2xl">
                <p className="text-[#1c3320]/50 italic">
                  Thank you for shopping at Danskys
                </p>
              </div>

            </div>
          </div>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
