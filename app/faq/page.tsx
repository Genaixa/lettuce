import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "FAQ | Danskys Pesach Lettuce",
  description:
    "Frequently asked questions about Danskys Pesach Lettuce pre-orders, delivery, and payment.",
};

const faqs = [
  {
    q: "What makes your lettuce kosher for Pesach?",
    a: "Every head is individually inspected by certified checkers. They check for insects as required by halacha, and all produce is handled in accordance with Pesach standards. All lettuce comes with appropriate kosher certification.",
  },
  {
    q: "How does the pre-order system work?",
    a: "You place your order and select a delivery or pickup option. Your card is pre-authorised (a hold placed) for the total amount — we do not charge you immediately. Payment is only captured when your order is prepared and ready for you.",
  },
  {
    q: "What does 'pre-authorised' mean for my payment?",
    a: "A pre-authorisation is a temporary hold on your card. It reserves the funds but does not debit your account. You will only see the actual charge when we confirm your order is ready.",
  },
  {
    q: "Which areas do you deliver to?",
    a: "Home delivery is available to the Bensham delivery zone (NE8). If your postcode doesn't start with NE8, please select in-store pickup.",
  },
  {
    q: "When will my order be delivered / ready for pickup?",
    a: "All orders are fulfilled the week before Pesach. You will receive an email when your order is ready. Delivery and pickup windows will be communicated closer to Pesach — please ensure your contact details are accurate.",
  },
  {
    q: "Can I leave my delivery with a neighbour?",
    a: "Yes! During checkout, you can specify a neighbour's name and door number. If you're out when we deliver, we'll leave it with them. Please make sure your neighbour is aware and available.",
  },
  {
    q: "What if I need to cancel my order?",
    a: "We are not accepting cancellations. Our lettuce is an expensive, perishable item and we cannot resell returned stock. Orders are final.",
  },
  {
    q: "Can I order without pre-ordering?",
    a: "To guarantee your stock, a pre-order must be placed. Walk-in stock may be available in store, but this cannot be relied upon.",
  },
];

export default function FAQPage() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-14">
              <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
                Got Questions?
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold text-[#1c3320] mb-4"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Frequently Asked Questions
              </h1>
              <p className="text-[#1c3320]/75 max-w-xl mx-auto">
                Everything you need to know about ordering your Pesach lettuce
                from Danskys.
              </p>
            </div>

            {/* FAQ Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/40 hover:shadow-sm rounded-xl p-6 transition-all"
                >
                  <h2
                    className="text-[#1c3320] font-semibold text-base mb-3 leading-snug"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                  >
                    {faq.q}
                  </h2>
                  <p className="text-[#1c3320]/75 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center p-8 bg-[#f2faf3] border border-[#c5e0cc] rounded-2xl">
              <h2
                className="text-xl font-semibold text-[#1c3320] mb-3"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Still have questions?
              </h2>
              <p className="text-[#1c3320]/75 text-sm mb-6">
                We&apos;re happy to help. Get in touch and we&apos;ll respond as soon as
                possible.
              </p>
              <a
                href="mailto:orders@danskys.co.uk"
                className="inline-flex px-6 py-3 bg-[#2d6e3e] hover:bg-[#245730] text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Email Us
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
