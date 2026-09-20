"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "@/lib/api/types";

const STORAGE_KEY = "fleurea-cart";
const DELIVERY_FEE = 80;
const FREE_DELIVERY_OVER = 1500;

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  add: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQty: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  replaceAll: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount. Cart state is client-only — never rendered on the server.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {
      // localStorage unavailable (private mode, etc.) — cart just won't persist.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const add: CartContextValue["add"] = (line) => {
    setLines((cur) => {
      const found = cur.find((l) => l.productId === line.productId);
      const qty = line.quantity ?? 1;
      if (found) {
        return cur.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + qty } : l));
      }
      return [...cur, { ...line, quantity: qty }];
    });
  };

  const setQty: CartContextValue["setQty"] = (productId, quantity) => {
    setLines((cur) =>
      quantity <= 0
        ? cur.filter((l) => l.productId !== productId)
        : cur.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
  };

  const remove: CartContextValue["remove"] = (productId) =>
    setLines((cur) => cur.filter((l) => l.productId !== productId));

  const clear = () => setLines([]);
  const replaceAll = (next: CartLine[]) => setLines(next);

  const { count, subtotal, deliveryFee, total } = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const deliveryFee = lines.length === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
    return { count, subtotal, deliveryFee, total: subtotal + deliveryFee };
  }, [lines]);

  return (
    <CartContext.Provider value={{ lines, count, subtotal, deliveryFee, total, add, setQty, remove, clear, replaceAll }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
