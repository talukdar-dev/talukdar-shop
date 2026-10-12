'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { discountPct, effectivePrice, taka } from '@/lib/format';
import { useCart } from '@/lib/cart';
import SmartImage from './SmartImage';

interface Props {
  product: Product;
  /** show short spec bullets (listing pages) */
  showSpecs?: boolean;
}

/**
 * StarTech-style product card: discount badge, image, 2-line name,
 * new + old price, add-to-cart button.
 */
export default function ProductCard({ product, showSpecs = false }: Props) {
  const price = effectivePrice(product);
  const pct = discountPct(price, product.old_price);
  const save =
    product.old_price && product.old_price > price ? product.old_price - price : 0;
  const { add, setDrawerOpen } = useCart();
  const inStock = product.stock_qty > 0;

  const specEntries = product.specs ? Object.entries(product.specs).slice(0, 4) : [];

  return (
    <div className="bg-white border border-[#e8e8e8] rounded-md overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.10)] hover:border-gray-300 transition-all flex flex-col h-full">
      <div className="relative">
        {pct !== null && save > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-brand text-white text-[11px] font-bold px-2 py-[3px] rounded-full shadow-sm">
            Save: {taka(save)} (-{pct}%)
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="block relative aspect-square bg-white"
          aria-label={product.name}
        >
          <SmartImage
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
            className="object-contain p-3"
          />
        </Link>
      </div>
      <div className="px-3 pb-3 pt-1 flex flex-col gap-1 grow">
        <Link
          href={`/product/${product.slug}`}
          className="text-[13px] leading-[1.35] text-[#333] hover:text-link hover:underline line-clamp-2 min-h-[35px]"
        >
          {product.name}
        </Link>
        {showSpecs && specEntries.length > 0 && (
          <ul className="text-[11.5px] text-ink leading-relaxed">
            {specEntries.map(([k, v]) => (
              <li key={k} className="truncate">
                <span className="font-semibold text-gray-600">{k}:</span>{' '}
                {Array.isArray(v) ? v.join(', ') : v}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-1.5">
          <span className="text-[15px] font-bold text-[#111]">{taka(price)}</span>
          {product.old_price && product.old_price > price && (
            <span className="text-[12px] text-[#999] line-through ml-2">
              {taka(product.old_price)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!inStock}
          onClick={() => {
            add(product, 1);
            setDrawerOpen(true);
          }}
          className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
