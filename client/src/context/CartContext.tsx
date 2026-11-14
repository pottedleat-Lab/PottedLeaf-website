import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../lib/types';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const KEY = 'pottedleaf-cart';
const CartContext = createContext<CartState | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const value = useMemo<CartState>(() => {
    const add = (p: Product, qty = 1) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === p.id);
        if (existing) {
          return prev.map((i) =>
            i.product_id === p.id ? { ...i, stock: p.quantity, quantity: Math.min(i.quantity + qty, p.quantity) } : i,
          );
        }
        return [
          ...prev,
          {
            product_id: p.id,
            name: p.name,
            price: Number(p.price),
            image_url: p.image_url,
            stock: p.quantity,
            quantity: Math.min(qty, p.quantity),
          },
        ];
      });
    const setQty = (id: string, qty: number) =>
      setItems((prev) =>
        prev.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i)),
      );
    const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product_id !== id));
    const clear = () => setItems([]);
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
