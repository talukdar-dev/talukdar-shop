'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart';
import { effectivePrice, taka } from '@/lib/format';
import QtyStepper from './QtyStepper';
import { IconCheck, IconCompare, IconHeart, IconHeartSolid, IconShare, IconStar, IconStarOutline } from './icons';

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-promo">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? (
          <IconStar key={i} className="w-4 h-4" />
        ) : (
          <IconStarOutline key={i} className="w-4 h-4" />
        ),
      )}
    </span>
  );
}

export default function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const { add, setDrawerOpen, wishlist, toggleWishlist, toggleCompare, isCompared } = useCart();
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [variantSel, setVariantSel] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const v of product.variants ?? []) {
      if (v.options[0]) init[v.id] = v.options[0].id;
    }
    return init;
  });

  const basePrice = effectivePrice(product);
  const variantDelta = (product.variants ?? []).reduce((sum, v) => {
    const opt = v.options.find((o) => o.id === variantSel[v.id]);
    return sum + (opt?.price_delta ?? 0);
  }, 0);
  const price = Math.max(0, basePrice + variantDelta);
  const regular = product.old_price && product.old_price > price ? product.old_price : price;
  const emiMonthly = Math.round(price / 12);
  const inStock = product.stock_qty > 0;
  const wished = wishlist.some((w) => w.id === product.id);
  const compared = isCompared(product.id);

  const buyNow = () => {
    add(product, qty, variantSel);
    router.push('/checkout');
  };

  const addToCart = () => {
    add(product, qty, variantSel);
    setDrawerOpen(true);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] leading-snug">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[13px]">
        <span className="flex items-center gap-1.5">
          <RatingStars rating={product.rating} />
          <a href="#reviews" className="text-link hover:underline">
            Reviews ({product.reviews_count})
          </a>
        </span>
        <span className="text-ink">
          Product Code: <span className="font-semibold text-gray-700">{product.sku}</span>
        </span>
        {product.brand && (
          <span className="text-ink">
            Brand:{' '}
            <Link href={`/search?brand=${product.brand.slug}`} className="text-link hover:underline font-semibold">
              {product.brand.name}
            </Link>
          </span>
        )}
        <span
          className={`font-bold ${inStock ? 'text-green-600' : 'text-red-600'}`}
          role="status"
        >
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      <div className="mt-4 bg-[#fafafa] border border-[#e8e8e8] rounded-md p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-black text-[#111]">{taka(price)}</span>
          {regular > price && (
            <span className="text-[16px] text-[#999] line-through">{taka(regular)}</span>
          )}
        </div>
        <dl className="mt-3 space-y-1.5 text-[13.5px]">
          <div className="flex justify-between gap-4">
            <dt className="font-bold text-gray-700">Cash Discount Price</dt>
            <dd className="font-bold text-brand">{taka(price)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink">Online / Cash Payment</dt>
            <dd className="text-ink">Best price for cash payment</dd>
          </div>
          {product.emi_available && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink">EMI</dt>
              <dd className="font-semibold text-gray-700">{taka(emiMonthly)}/month</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="font-bold text-gray-700">Regular Price</dt>
            <dd className="font-semibold text-gray-700">{taka(regular)}</dd>
          </div>
        </dl>
        {product.emi_available && (
          <p className="mt-2 text-[12.5px] text-ink">0% EMI for up to 12 Months*</p>
        )}
      </div>

      <div className="mt-5">
        {(product.variants ?? []).length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {(product.variants ?? []).map((v) => (
              <div key={v.id}>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                  {v.name}:
                </label>
                <select
                  value={variantSel[v.id] ?? ''}
                  onChange={(e) => setVariantSel((s) => ({ ...s, [v.id]: e.target.value }))}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg text-[13.5px] outline-none focus:border-brand bg-white"
                >
                  {v.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}{o.price_delta !== 0 ? ` (${o.price_delta > 0 ? '+' : ''}${taka(o.price_delta)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-semibold text-gray-600">Quantity:</span>
          <QtyStepper value={qty} onChange={setQty} max={Math.min(99, Math.max(1, product.stock_qty))} />
          <span className={`text-[12px] font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
            {inStock ? `${product.stock_qty} pcs available` : 'Out of stock'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={addToCart}
            disabled={!inStock}
            className="h-12 bg-brand hover:bg-brand-dark active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[14px] sm:text-[15px] font-bold rounded-lg transition-all uppercase tracking-wide shadow-sm hover:shadow-md"
          >
            Add to Cart
          </button>
          <button
            onClick={buyNow}
            disabled={!inStock}
            className="h-12 bg-[#3749bb] hover:bg-[#2a3a9e] active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[14px] sm:text-[15px] font-bold rounded-lg transition-all uppercase tracking-wide shadow-sm hover:shadow-md"
          >
            Buy Now
          </button>
        </div>
        <div className="flex items-center gap-2.5 mt-3">
          <button
            onClick={() => toggleWishlist(product)}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            title="Add to wishlist"
            className={`h-10 px-4 rounded-lg border flex items-center gap-2 text-[13px] font-medium transition-colors ${
              wished ? 'border-brand text-brand bg-brand/5' : 'border-gray-300 text-gray-500 hover:border-brand hover:text-brand'
            }`}
          >
            {wished ? <IconHeartSolid className="w-4 h-4" /> : <IconHeart className="w-4 h-4" />}
            Wishlist
          </button>
          <button
            onClick={() => toggleCompare(product)}
            aria-label={compared ? 'Remove from compare' : 'Add to compare'}
            title="Add to compare"
            className={`h-10 px-4 rounded-lg border flex items-center gap-2 text-[13px] font-medium transition-colors ${
              compared ? 'border-brand text-brand bg-brand/5' : 'border-gray-300 text-gray-500 hover:border-brand hover:text-brand'
            }`}
          >
            <IconCompare className="w-4 h-4" />
            Compare
          </button>
          <button
            onClick={share}
            className="h-10 px-4 rounded-lg border border-gray-300 flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:border-brand hover:text-brand transition-colors"
          >
            <IconShare className="w-4 h-4" />
            {copied ? <span className="text-green-600 font-semibold">Copied!</span> : 'Share'}
          </button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
          <p className="text-[11px] font-bold text-gray-700">Fast Delivery</p>
          <p className="text-[10.5px] text-ink mt-0.5">Inside Dhaka 24h</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
          <p className="text-[11px] font-bold text-gray-700">Official Warranty</p>
          <p className="text-[10.5px] text-ink mt-0.5">100% Genuine</p>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
          <p className="text-[11px] font-bold text-gray-700">EMI Available</p>
          <p className="text-[10.5px] text-ink mt-0.5">0% up to 12 mo</p>
        </div>
      </div>
    </div>
  );
}
