"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import type { Cart } from "@/lib/types";

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, authFetch } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await authFetch<Cart>("/cart");
      setCart(data);
    } finally {
      setIsLoading(false);
    }
  }, [user, authFetch]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      const data = await authFetch<Cart>("/cart/items", { method: "POST", body: { variantId, quantity } });
      setCart(data);
    },
    [authFetch],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      const data = await authFetch<Cart>(`/cart/items/${itemId}`, { method: "PATCH", body: { quantity } });
      setCart(data);
    },
    [authFetch],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const data = await authFetch<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
      setCart(data);
    },
    [authFetch],
  );

  const clear = useCallback(async () => {
    const data = await authFetch<Cart>("/cart", { method: "DELETE" });
    setCart(data);
  }, [authFetch]);

  return (
    <CartContext.Provider value={{ cart, isLoading, refresh, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
