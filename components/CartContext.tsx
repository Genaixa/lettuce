"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { CartItem, DeliveryMethod, Product } from "@/types";

const DELIVERY_COST = 5.0;
const PICKUP_COST = 2.5;

interface CartContextValue {
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("danskys_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadDeliveryMethod(): DeliveryMethod {
  try {
    const raw = localStorage.getItem("danskys_delivery");
    return raw === "delivery" ? "delivery" : "pickup";
  } catch {
    return "pickup";
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
    setDeliveryMethod(loadDeliveryMethod());
  }, []);

  // Persist items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("danskys_cart", JSON.stringify(items));
  }, [items]);

  // Persist delivery method whenever it changes
  useEffect(() => {
    localStorage.setItem("danskys_delivery", deliveryMethod);
  }, [deliveryMethod]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const shippingCost = deliveryMethod === "delivery" ? DELIVERY_COST : PICKUP_COST;
  const total = subtotal + shippingCost;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      deliveryMethod,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setDeliveryMethod,
      itemCount,
      subtotal,
      shippingCost,
      total,
    }),
    [
      items,
      deliveryMethod,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      shippingCost,
      total,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
