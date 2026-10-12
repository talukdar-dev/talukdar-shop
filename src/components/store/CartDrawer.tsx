'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart, lineKey, lineUnitPrice, variantLabel } from '@/lib/cart';
import { effectivePrice, taka } from '@/lib/format';
import SmartImage from './SmartImage';
import QtyStepper from './QtyStepper';
import { IconClose, IconTrash } from './icons';

export default function CartDrawer() {
  const { lines, subtotal, count, drawerOpen, setDrawerOpen, setQty, remove, mounted } =
    useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`drawer-overlay fixed inset-0 bg-black/50 z-50 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`drawer-panel fixed inset-y-0 right-0 w-[340px] max-w-[90vw] bg-white z-50 flex flex-col shadow-2xl ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-[16px]">
            Shopping Cart {count > 0 && <span className="text-ink font-normal">({count})</span>}
          </h2>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="p-1 hover:text-brand">
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll">
          {lines.length === 0 ? (
            <p className="px-4 py-8 text-center text-ink text-sm">Your cart is empty.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {lines.map((line) => {
                const { product, qty } = line;
                const key = lineKey(line);
                const vLabel = variantLabel(line);
                return (
                <li key={key} className="flex gap-3 px-4 py-3">
                  <Link href={`/product/${product.slug}`} className="relative w-16 h-16 shrink-0" onClick={() => setDrawerOpen(false)}>
                    <SmartImage src={product.images[0]} alt={product.name} fill className="object-contain" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="block text-[13px] text-gray-800 line-clamp-2 leading-snug hover:text-link"
                    >
                      {product.name}
                    </Link>
                    {vLabel && (
                      <p className="text-[11px] text-ink mt-0.5">{vLabel}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <QtyStepper small value={qty} onChange={(v) => setQty(key, v)} />
                      <span className="text-[13px] font-bold">{taka(lineUnitPrice(line) * qty)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(key)}
                    aria-label="Remove item"
                    className="self-start p-1 text-gray-400 hover:text-red-600"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex justify-between text-[14px] font-bold mb-3">
              <span>Subtotal</span>
              <span className="text-brand">{taka(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={() => setDrawerOpen(false)}
                className="text-center py-2.5 border border-brand text-brand rounded-md text-[13px] font-bold hover:bg-brand/5"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="text-center py-2.5 bg-brand hover:bg-brand-dark text-white rounded-md text-[13px] font-bold transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
