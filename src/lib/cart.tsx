'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product, ProductVariant } from './types';
import { effectivePrice } from './format';

export interface CartLine {
  product: Product;
  qty: number;
  /** variantId -> optionId */
  variantSelection?: Record<string, string>;
}

/** Calculate unit price including variant price deltas */
export function lineUnitPrice(line: CartLine): number {
  let price = effectivePrice(line.product);
  if (line.variantSelection && line.product.variants) {
    for (const v of line.product.variants) {
      const optId = line.variantSelection[v.id];
      const opt = v.options.find((o) => o.id === optId);
      if (opt) price += opt.price_delta;
    }
  }
  return Math.max(0, price);
}

/** Human-readable variant label e.g. "Color: Red, Size: Large" */
export function variantLabel(line: CartLine): string {
  if (!line.variantSelection || !line.product.variants) return '';
  const parts: string[] = [];
  for (const v of line.product.variants) {
    const optId = line.variantSelection[v.id];
    const opt = v.options.find((o) => o.id === optId);
    if (opt) parts.push(`${v.name}: ${opt.label}`);
  }
  return parts.join(', ');
}

/** Unique key for a cart line (product + variant combo) */
export function lineKey(line: CartLine): string {
  const vs = line.variantSelection
    ? Object.entries(line.variantSelection).sort().map(([k, v]) => `${k}=${v}`).join('|')
    : '';
  return `${line.product.id}::${vs}`;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number, variantSelection?: Record<string, string>) => void;
  remove: (lineKeyStr: string) => void;
  setQty: (lineKeyStr: string, qty: number) => void;
  clear: () => void;
  wishlist: Product[];
  toggleWishlist: (p: Product) => void;
  isWishlisted: (id: string) => boolean;
  compareList: Product[];
  toggleCompare: (p: Product) => void;
  isCompared: (id: string) => boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  mounted: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => read('ts_cart', []));
  const [wishlist, setWishlist] = useState<Product[]>(() => read('ts_wishlist', []));
  const [compareList, setCompareList] = useState<Product[]>(() =>
    read('ts_compare', []),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    write('ts_cart', lines);
  }, [lines]);
  useEffect(() => {
    write('ts_wishlist', wishlist);
  }, [wishlist]);
  useEffect(() => {
    write('ts_compare', compareList);
  }, [compareList]);

  const add = useCallback((product: Product, qty = 1, variantSelection?: Record<string, string>) => {
    setLines((prev) => {
      const key = lineKey({ product, qty: 0, variantSelection });
      const found = prev.find((l) => lineKey(l) === key);
      if (found) {
        return prev.map((l) =>
          lineKey(l) === key
            ? { ...l, qty: Math.min(l.qty + qty, 99) }
            : l,
        );
      }
      return [...prev, { product, qty: Math.max(1, Math.min(qty, 99)), variantSelection }];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) =>
            lineKey(l) === key
              ? { ...l, qty: Math.min(qty, 99) }
              : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toggleWishlist = useCallback((p: Product) => {
    setWishlist((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev, p],
    );
  }, []);

  const toggleCompare = useCallback((p: Product) => {
    setCompareList((prev) =>
      prev.some((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : [...prev.slice(-3), p],
    );
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = lines.reduce(
      (s, l) => s + lineUnitPrice(l) * l.qty,
      0,
    );
    return {
      lines,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      wishlist,
      toggleWishlist,
      isWishlisted: (id: string) => wishlist.some((x) => x.id === id),
      compareList,
      toggleCompare,
      isCompared: (id: string) => compareList.some((x) => x.id === id),
      drawerOpen,
      setDrawerOpen,
      mounted,
    };
  }, [
    lines,
    wishlist,
    compareList,
    drawerOpen,
    mounted,
    add,
    remove,
    setQty,
    clear,
    toggleWishlist,
    toggleCompare,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

/** Demo account helpers (phone-based, localStorage only). */
export function getDemoUser(): { name: string; phone: string } | null {
  return read('ts_user', null);
}

export function setDemoUser(name: string, phone: string) {
  write('ts_user', { name, phone });
}

export function clearDemoUser() {
  if (typeof window !== 'undefined') window.localStorage.removeItem('ts_user');
}
