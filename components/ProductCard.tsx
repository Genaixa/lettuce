"use client";

import Image from "next/image";
import { ShoppingCart, Tag } from "lucide-react";
import { useCart } from "./CartContext";
import type { Product } from "@/types";
import clsx from "clsx";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);

  return (
    <div className="w-full bg-white border border-[#c5e0cc] rounded-xl overflow-hidden flex flex-col group hover:border-[#2d6e3e]/50 hover:shadow-md hover:shadow-[#2d6e3e]/10 transition-all duration-300">
      {/* Image */}
      <div className="relative h-52 bg-[#f2faf3] overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🥬</span>
          </div>
        )}
        {product.badge && !product.badge_starburst && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2d6e3e] text-white text-xs font-bold rounded-full">
              <Tag size={10} />
              {product.badge}
            </span>
          </div>
        )}
        {product.supervision && product.badge_starburst && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2d6e3e] text-white text-xs font-bold rounded-full">
              <Tag size={10} />
              {product.supervision}
            </span>
          </div>
        )}
        {product.badge && product.badge_starburst && (
          <div className="absolute top-1 right-1 w-24 h-24 flex items-center justify-center">
            <div className="absolute w-[4.5rem] h-[4.5rem] bg-[#dc2626]" />
            <div className="absolute w-[4.5rem] h-[4.5rem] bg-[#dc2626] rotate-[22.5deg]" />
            <div className="absolute w-[4.5rem] h-[4.5rem] bg-[#dc2626] rotate-[45deg]" />
            <div className="absolute w-[4.5rem] h-[4.5rem] bg-[#dc2626] rotate-[67.5deg]" />
            <span
              className="relative z-10 text-center text-white text-[11px] font-bold italic leading-tight px-2"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              {product.badge.split(" - ")[1] ?? product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3
            className="text-[#1c3320] font-semibold text-lg mb-1 leading-snug"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {product.name}
          </h3>
          {product.meta && (
            <p className="text-[#2d6e3e] text-xs font-medium mb-2">
              {product.meta}
            </p>
          )}
          <p className="text-[#1c3320] text-sm font-medium leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className="text-2xl font-semibold text-[#1c3320]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            £{product.price.toFixed(2)}
          </span>

          {product.stock_quantity != null && product.stock_quantity <= 0 ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-400 cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <button
              onClick={() => addItem(product)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                cartItem
                  ? "bg-[#2d6e3e] text-white hover:bg-[#245730]"
                  : "bg-[#c9a84c] text-[#1c3320] hover:bg-[#a8863a] active:scale-95"
              )}
            >
              <ShoppingCart size={15} />
              {cartItem ? `In cart (${cartItem.quantity})` : "Add to Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
