"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import CartSection from "./CartSection";
import CheckoutForm from "./CheckoutForm";
import { useCart } from "@/components/CartContext";
import type { Product } from "@/types";
import { Loader2, AlertCircle, Lock } from "lucide-react";

// Fallback products if Supabase isn't configured yet
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Romaine Lettuce Head",
    description:
      "Premium kosher-checked romaine lettuce. Crisp leaves, ideal for salads and wraps.",
    price: 3.99,
    image_url: null,
    badge: "Bestseller",
    meta: "1 head — serves 2-4",
    active: true,
    sort_order: 1,
  },
  {
    id: "prod-2",
    name: "Iceberg Lettuce Head",
    description: "Classic iceberg lettuce, crisp and refreshing. Kosher-checked for Pesach use.",
    price: 3.49,
    image_url: null,
    badge: null,
    meta: "1 head — serves 2-4",
    active: true,
    sort_order: 2,
  },
  {
    id: "prod-3",
    name: "Romaine Lettuce 3-Pack",
    description:
      "Three kosher-checked romaine lettuce heads — great value for larger families or sedarim.",
    price: 10.99,
    image_url: null,
    badge: "Best Value",
    meta: "3 heads — serves 8-12",
    active: true,
    sort_order: 3,
  },
  {
    id: "prod-4",
    name: "Mixed Lettuce Bundle",
    description: "A selection of romaine and iceberg heads, pre-inspected and ready.",
    price: 12.99,
    image_url: null,
    badge: "Bundle Deal",
    meta: "2 romaine + 2 iceberg",
    active: true,
    sort_order: 4,
  },
];

export default function OrderPageClient() {
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    reference: string;
  } | null>(null);
  const [threeDSLoading, setThreeDSLoading] = useState(false);
  const [threeDSError, setThreeDSError] = useState<string | null>(null);
  const threeDSHandled = useRef(false);

  // Handle return from Blink 3DS redirect
  useEffect(() => {
    if (threeDSHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get("transaction_id");
    const status = params.get("status");

    if (!transactionId) return;
    threeDSHandled.current = true;

    // Log so we can see what Blink returns
    console.log("[3DS return] transaction_id:", transactionId, "status:", status, "all params:", Object.fromEntries(params));

    window.history.replaceState({}, "", "/order");

    const failStatuses = ["failed", "cancelled", "error", "declined"];
    if (status && failStatuses.includes(status.toLowerCase())) {
      setThreeDSError(`Payment was not completed (${status}). Please go back and try again.`);
      return;
    }

    const savedRaw = sessionStorage.getItem("blink_3ds_pending");
    if (!savedRaw) {
      setThreeDSError("Session data not found. If payment was taken please contact us with your email address.");
      return;
    }
    sessionStorage.removeItem("blink_3ds_pending");

    setThreeDSLoading(true);
    let savedPayload: unknown;
    try {
      savedPayload = JSON.parse(savedRaw);
    } catch {
      setThreeDSError("Could not read session data. Please contact us.");
      setThreeDSLoading(false);
      return;
    }

    fetch("/api/orders/complete-3ds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, ...(savedPayload as object) }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setOrderSuccess({ orderId: data.orderId, reference: data.reference });
        } else {
          setThreeDSError(
            Array.isArray(data.errors)
              ? data.errors.join(". ")
              : data.error ?? "Failed to complete order. Please contact us."
          );
        }
      })
      .catch(() =>
        setThreeDSError("Network error completing order. Please contact us.")
      )
      .finally(() => setThreeDSLoading(false));
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
          setProducts(FALLBACK_PRODUCTS);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;
        setProducts(data?.length ? data : FALLBACK_PRODUCTS);
      } catch {
        setProducts(FALLBACK_PRODUCTS);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // 3DS in-flight
  if (threeDSLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Loader2 className="animate-spin text-[#2d6e3e] mx-auto mb-6" size={48} />
          <h1
            className="text-2xl font-bold text-[#1c3320] mb-3"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            Completing your order…
          </h1>
          <p className="text-[#1c3320]/60 text-sm">
            Please wait while we confirm your payment and create your order.
          </p>
        </div>
      </div>
    );
  }

  // 3DS error
  if (threeDSError) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="text-red-500 mx-auto mb-6" size={48} />
          <h1
            className="text-2xl font-bold text-[#1c3320] mb-3"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            Payment Not Completed
          </h1>
          <p className="text-red-500 text-sm mb-8 leading-relaxed">{threeDSError}</p>
          <a
            href="/order"
            className="inline-flex px-6 py-3 bg-[#2d6e3e] hover:bg-[#245730] text-white font-semibold rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-6">🥬</div>
          <h1
            className="text-3xl font-bold text-[#1c3320] mb-4"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            Order Placed!
          </h1>
          <p className="text-[#1c3320]/70 text-base mb-2">
            Thank you for your pre-order. Your reference is:
          </p>
          <p className="text-2xl font-mono font-bold text-[#2d6e3e] mb-6">
            #{orderSuccess.reference}
          </p>
          <p className="text-[#1c3320]/60 text-sm mb-8 leading-relaxed">
            A confirmation email has been sent with your order details. Your
            card has been pre-authorised — payment will only be captured when
            your order is ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-[#2d6e3e] hover:bg-[#245730] text-white font-semibold rounded-xl transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Products Section */}
      <section id="products" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
              Our Selection
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#1c3320] mb-4"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Pre-Order Your Pesach Lettuce
            </h1>
            <p className="text-[#1c3320]/60 mt-3 max-w-2xl mx-auto">
              Add products to your order below, then complete checkout. Your
              card will be pre-authorised — not charged — until your order is
              ready.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2d6e3e]" size={32} />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 mb-8">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-5">
            {products.map((product) => (
              <div key={product.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-72 flex">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-[#f2faf3] border border-[#c5e0cc] rounded-xl text-sm text-[#1c3320]/60 leading-relaxed">
            Our full range of regular fresh lettuces and salad mixes will be
            available in store as usual.{" "}
            <span className="text-[#1c3320]/40">
              Pre-ordering is not available on those items.
            </span>
          </div>
        </div>
      </section>

      {/* Cart + Checkout */}
      <section id="cart" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#c5e0cc] bg-[#f9fdf9]">
        <div className="max-w-7xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🛒</div>
              <h2
                className="text-2xl font-semibold text-[#1c3320] mb-3"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                Your cart is empty
              </h2>
              <p className="text-[#1c3320]/50 text-base mb-8">
                Add some products above to continue with your pre-order.
              </p>
              <a
                href="#products"
                className="inline-flex px-6 py-3 bg-[#2d6e3e] hover:bg-[#245730] text-white font-semibold rounded-xl transition-colors"
              >
                Browse Products
              </a>
            </div>
          ) : !checkoutStarted ? (
            /* Step 1 — cart + delivery method selection */
            <div className="max-w-md mx-auto">
              <CartSection />
              <button
                type="button"
                onClick={() => setCheckoutStarted(true)}
                className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-[#2d6e3e] hover:bg-[#245730] text-white font-bold text-base rounded-xl transition-all duration-200 active:scale-[0.99]"
              >
                <Lock size={16} />
                Continue to Payment
              </button>
            </div>
          ) : (
            /* Step 2 — locked cart + checkout form */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <CartSection
                  locked
                  onChangeDelivery={() => setCheckoutStarted(false)}
                />
              </div>
              <div className="lg:col-span-3">
                <CheckoutForm
                  onSuccess={(orderId, reference) =>
                    setOrderSuccess({ orderId, reference })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
