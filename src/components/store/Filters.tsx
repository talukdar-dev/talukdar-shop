'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Brand } from '@/lib/types';

interface Props {
  brands: Brand[];
  total: number;
}

const SORTS = [
  { v: '', label: 'Default' },
  { v: 'price-asc', label: 'Price (Low > High)' },
  { v: 'price-desc', label: 'Price (High > Low)' },
];

const PER_PAGE = ['20', '24', '48', '75', '90'];

export default function Filters({ brands, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [min, setMin] = useState(sp.get('min') ?? '');
  const [max, setMax] = useState(sp.get('max') ?? '');

  const apply = (mut: (s: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp.toString());
    mut(next);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  };

  const inStock = sp.get('inStock') === '1';

  return (
    <div className="bg-white rounded-md border border-[#e8e8e8] divide-y divide-gray-100 text-[13.5px]">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-bold text-[15px]">Filters</h2>
        <button
          onClick={() => {
            // Preserve the search query when resetting filters on the search page
            const q = sp.get('q');
            router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
          }}
          className="text-link text-[12.5px] hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2 text-[13px] uppercase tracking-wide text-gray-600">
          Availability
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) =>
              apply((s) => (e.target.checked ? s.set('inStock', '1') : s.delete('inStock')))
            }
            className="w-4 h-4 accent-[#ef4a23]"
          />
          In Stock
        </label>
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2 text-[13px] uppercase tracking-wide text-gray-600">Brand</h3>
        <select
          value={sp.get('brand') ?? ''}
          onChange={(e) =>
            apply((s) => (e.target.value ? s.set('brand', e.target.value) : s.delete('brand')))
          }
          className="w-full h-9 px-2 border border-gray-300 rounded-md bg-white outline-none focus:border-brand"
          aria-label="Filter by brand"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2 text-[13px] uppercase tracking-wide text-gray-600">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full h-9 px-2 border border-gray-300 rounded-md outline-none focus:border-brand text-[13px]"
            aria-label="Minimum price"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full h-9 px-2 border border-gray-300 rounded-md outline-none focus:border-brand text-[13px]"
            aria-label="Maximum price"
          />
        </div>
        <button
          onClick={() =>
            apply((s) => {
              if (min) s.set('min', min);
              else s.delete('min');
              if (max) s.set('max', max);
              else s.delete('max');
            })
          }
          className="mt-2 w-full h-9 bg-navy hover:bg-navy-dark text-white text-[13px] font-bold rounded-md transition-colors"
        >
          Apply Price
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2 text-[13px] uppercase tracking-wide text-gray-600">Sort By</h3>
        <select
          value={sp.get('sort') ?? ''}
          onChange={(e) =>
            apply((s) => (e.target.value ? s.set('sort', e.target.value) : s.delete('sort')))
          }
          className="w-full h-9 px-2 border border-gray-300 rounded-md bg-white outline-none focus:border-brand"
          aria-label="Sort products"
        >
          {SORTS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4">
        <h3 className="font-bold mb-2 text-[13px] uppercase tracking-wide text-gray-600">
          Show Per Page
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {PER_PAGE.map((n) => {
            const active = (sp.get('perPage') ?? '20') === n;
            return (
              <button
                key={n}
                onClick={() => apply((s) => s.set('perPage', n))}
                className={`min-w-[38px] h-8 px-2 text-[12.5px] font-semibold rounded-md border ${
                  active
                    ? 'bg-brand border-brand text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-brand'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-ink">{total} product{total === 1 ? '' : 's'} found</p>
      </div>
    </div>
  );
}
