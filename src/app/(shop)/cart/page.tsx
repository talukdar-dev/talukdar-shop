'use client';

import Link from 'next/link';
import { useCart, lineKey, lineUnitPrice, variantLabel } from '@/lib/cart';
import { taka } from '@/lib/format';
import QtyStepper from '@/components/store/QtyStepper';
import SmartImage from '@/components/store/SmartImage';
import { IconTrash } from '@/components/store/icons';

export default function CartPage() {
  const { lines, subtotal, count, setQty, remove, clear, mounted } = useCart();

  if (!mounted) {
    return <p className="text-sm text-ink py-10 text-center">Loading cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center">
        <h1 className="text-[20px] font-bold mb-2">Your cart is empty</h1>
        <p className="text-[13.5px] text-ink mb-5">
          Looks like you have not added anything to your cart yet.
        </p>
        <Link
          href="/"
          className="inline-block px-8 h-11 leading-[44px] bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[20px] font-bold text-[#1a1a1a]">
        Shopping Cart <span className="text-ink font-normal text-[15px]">({count} {count === 1 ? 'item' : 'items'})</span>
      </h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-4 items-start">
        <div className="bg-white rounded-md border border-[#e8e8e8] divide-y divide-gray-100">
          {lines.map((line) => {
            const { product, qty } = line;
            const key = lineKey(line);
            const vLabel = variantLabel(line);
            const unit = lineUnitPrice(line);
            return (
            <div key={key} className="flex gap-3 sm:gap-4 p-3 sm:p-4">
              <Link
                href={`/product/${product.slug}`}
                className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0"
              >
                <SmartImage src={product.images[0]} alt={product.name} fill className="object-contain" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${product.slug}`}
                  className="text-[13.5px] sm:text-[14px] text-gray-800 hover:text-link hover:underline line-clamp-2 leading-snug"
                >
                  {product.name}
                </Link>
                {vLabel && <p className="text-[12px] text-ink mt-0.5">{vLabel}</p>}
                <p className="text-[13px] font-bold text-brand mt-1">{taka(unit)}</p>
                <div className="flex items-center justify-between mt-2">
                  <QtyStepper small value={qty} onChange={(v) => setQty(key, v)} />
                  <button
                    onClick={() => remove(key)}
                    className="flex items-center gap-1 text-[12.5px] text-gray-500 hover:text-red-600"
                  >
                    <IconTrash className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
              <div className="hidden sm:block text-[14px] font-bold shrink-0">
                {taka(unit * qty)}
              </div>
            </div>
            );
          })}
          <div className="p-3 sm:p-4 flex justify-between">
            <Link href="/" className="text-[13.5px] text-link hover:underline font-semibold">
              ← Continue Shopping
            </Link>
            <button onClick={clear} className="text-[13.5px] text-gray-500 hover:text-red-600">
              Clear Cart
            </button>
          </div>
        </div>

        <aside className="bg-white rounded-md border border-[#e8e8e8] p-4 lg:sticky lg:top-16">
          <h2 className="font-bold text-[15px] mb-3">Order Summary</h2>
          <div className="flex justify-between text-[13.5px] mb-1.5">
            <span className="text-ink">Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
            <span className="font-bold">{taka(subtotal)}</span>
          </div>
          <p className="text-[12px] text-ink mb-4">Shipping calculated at checkout.</p>
          <Link
            href="/checkout"
            className="block text-center h-11 leading-[44px] bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md transition-colors uppercase tracking-wide"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </>
  );
}
