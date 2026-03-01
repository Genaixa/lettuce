"use client";

import { useCart } from "@/components/CartContext";
import { Trash2, Plus, Minus, Truck, Store } from "lucide-react";

interface CartSectionProps {
  locked?: boolean;
  onChangeDelivery?: () => void;
}

export default function CartSection({ locked = false, onChangeDelivery }: CartSectionProps) {
  const {
    items,
    deliveryMethod,
    setDeliveryMethod,
    updateQuantity,
    removeItem,
    subtotal,
    shippingCost,
    total,
  } = useCart();

  return (
    <div className="sticky top-20">
      <h2
        className="text-xl font-semibold text-[#1c3320] mb-6"
        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        Your Order
      </h2>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-start gap-3 p-3 bg-[#f2faf3] rounded-xl border border-[#c5e0cc]"
          >
            <div className="text-2xl flex-shrink-0">🥬</div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1c3320] text-sm font-medium truncate">
                {item.product.name}
              </p>
              <p className="text-[#2d6e3e] text-sm">
                £{(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={12} />
              </button>
              <span className="w-7 text-center text-[#1c3320] text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={() => removeItem(item.product.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#1c3320]/30 hover:text-red-500 transition-colors ml-1"
                aria-label="Remove item"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Method */}
      <div className="mb-6">
        <p className="text-sm font-medium text-[#1c3320]/80 mb-3">
          Delivery Method
        </p>

        {locked ? (
          <div className="flex items-center justify-between p-3 bg-[#e8f5eb] border border-[#2d6e3e] rounded-xl">
            <div className="flex items-center gap-2 text-[#2d6e3e] font-medium text-sm">
              {deliveryMethod === "pickup" ? <Store size={16} /> : <Truck size={16} />}
              <span>{deliveryMethod === "pickup" ? "Pickup — +£2.50" : "Home Delivery — +£5.00"}</span>
            </div>
            {onChangeDelivery && (
              <button
                type="button"
                onClick={onChangeDelivery}
                className="text-xs text-[#2d6e3e]/70 hover:text-[#2d6e3e] underline"
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  deliveryMethod === "pickup"
                    ? "border-[#2d6e3e] bg-[#e8f5eb] text-[#2d6e3e]"
                    : "border-[#c5e0cc] bg-white text-[#1c3320]/60 hover:border-[#a8d4b0]"
                }`}
              >
                <Store size={18} />
                <span>Pickup</span>
                <span className="text-xs font-normal opacity-70">+£2.50</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  deliveryMethod === "delivery"
                    ? "border-[#2d6e3e] bg-[#e8f5eb] text-[#2d6e3e]"
                    : "border-[#c5e0cc] bg-white text-[#1c3320]/60 hover:border-[#a8d4b0]"
                }`}
              >
                <Truck size={18} />
                <span>Delivery</span>
                <span className="text-xs font-normal opacity-70">+£5.00</span>
              </button>
            </div>
            {deliveryMethod === "delivery" && (
              <p className="text-[#1c3320]/40 text-xs mt-2">
                Bensham delivery zone only. Your postcode will be validated at checkout.
              </p>
            )}
          </>
        )}
      </div>

      {/* Totals */}
      <div className="bg-[#f2faf3] rounded-xl border border-[#c5e0cc] p-4 space-y-2">
        <div className="flex justify-between text-sm text-[#1c3320]/60">
          <span>Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#1c3320]/60">
          <span>
            {deliveryMethod === "pickup" ? "Collection fee" : "Home delivery"}
          </span>
          <span>£{shippingCost.toFixed(2)}</span>
        </div>
        <div className="border-t border-[#c5e0cc] pt-2 flex justify-between">
          <span className="font-semibold text-[#1c3320]">Total</span>
          <span
            className="font-bold text-xl text-[#2d6e3e]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            £{total.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[#1c3320]/40 text-xs leading-relaxed">
        Your card will be pre-authorised, not charged, when you place your
        order. Payment is captured when your order is ready.
      </p>
    </div>
  );
}
