'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart';
import { effectivePrice, taka } from '@/lib/format';
import SmartImage from './SmartImage';
import { IconCheck, IconClose, IconSearch } from './icons';

export interface BuilderRow {
  key: string;
  label: string;
  required: boolean;
  products: Product[];
}

export default function PCBuilderClient({ rows }: { rows: BuilderRow[] }) {
  const router = useRouter();
  const { add, setDrawerOpen } = useCart();
  const [selected, setSelected] = useState<Record<string, Product>>({});
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const pickerRow = rows.find((r) => r.key === pickerFor);
  const pickerProducts = useMemo(() => {
    if (!pickerRow) return [];
    const q = query.trim().toLowerCase();
    return pickerRow.products.filter(
      (p) => !q || p.name.toLowerCase().includes(q),
    );
  }, [pickerRow, query]);

  const total = useMemo(
    () => Object.values(selected).reduce((s, p) => s + effectivePrice(p), 0),
    [selected],
  );

  const addBuild = () => {
    const missing = rows.filter((r) => r.required && !selected[r.key]);
    if (missing.length > 0) {
      setError(`Please choose: ${missing.map((r) => r.label).join(', ')} (required).`);
      return;
    }
    setError('');
    Object.values(selected).forEach((p) => add(p, 1));
    setDrawerOpen(true);
    router.push('/cart');
  };

  return (
    <>
      <div className="bg-white rounded-md border border-[#e8e8e8] divide-y divide-gray-100">
        {rows.map((row) => {
          const p = selected[row.key];
          return (
            <div key={row.key} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="w-32 sm:w-44 shrink-0">
                <p className="text-[13.5px] font-bold text-gray-800">
                  {row.label}{' '}
                  {row.required && (
                    <span className="text-[10.5px] font-bold text-white bg-brand rounded px-1.5 py-0.5 ml-1 align-middle">
                      Required
                    </span>
                  )}
                </p>
              </div>
              {p ? (
                <>
                  <span className="relative w-14 h-14 shrink-0 hidden sm:block">
                    <SmartImage src={p.images[0]} alt={p.name} fill className="object-contain" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 truncate">{p.name}</p>
                    <p className="text-[13px] font-bold text-brand">{taka(effectivePrice(p))}</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuery('');
                      setPickerFor(row.key);
                    }}
                    className="text-[12.5px] font-bold text-link hover:underline shrink-0"
                  >
                    Change
                  </button>
                  <button
                    onClick={() =>
                      setSelected((prev) => {
                        const next = { ...prev };
                        delete next[row.key];
                        return next;
                      })
                    }
                    aria-label={`Remove ${row.label}`}
                    className="p-1.5 text-gray-400 hover:text-red-600 shrink-0"
                  >
                    <IconClose className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="inline-block w-14 h-14 bg-gray-100 rounded-md border border-dashed border-gray-300" />
                  </div>
                  <button
                    onClick={() => {
                      setQuery('');
                      setPickerFor(row.key);
                    }}
                    className="px-5 h-9 bg-navy hover:bg-navy-dark text-white text-[13px] font-bold rounded-md shrink-0"
                  >
                    Choose
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-[13px] bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="mt-4 bg-white rounded-md border border-[#e8e8e8] p-4 flex flex-wrap items-center justify-between gap-3 lg:sticky lg:bottom-4 shadow-sm">
        <p className="text-[15px]">
          <span className="text-ink">Total build price: </span>
          <span className="text-[20px] font-black text-brand">{taka(total)}</span>
        </p>
        <button
          onClick={addBuild}
          className="h-11 px-8 bg-brand hover:bg-brand-dark text-white text-[14px] font-bold rounded-md uppercase tracking-wide transition-colors"
        >
          Add Build to Cart
        </button>
      </div>

      {/* picker modal */}
      {pickerRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPickerFor(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-bold text-[15px]">Choose {pickerRow.label}</h3>
              <button onClick={() => setPickerFor(null)} aria-label="Close picker" className="p-1 hover:text-brand">
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${pickerRow.label.toLowerCase()}…`}
                  className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand"
                  aria-label={`Search ${pickerRow.label}`}
                />
                <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto thin-scroll divide-y divide-gray-100">
              {pickerProducts.length === 0 && (
                <li className="p-6 text-center text-sm text-ink">No products found.</li>
              )}
              {pickerProducts.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setSelected((prev) => ({ ...prev, [pickerRow.key]: p }));
                      setPickerFor(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                  >
                    <span className="relative w-12 h-12 shrink-0">
                      <SmartImage src={p.images[0]} alt={p.name} fill className="object-contain" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] text-gray-800 truncate">{p.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-brand">{taka(effectivePrice(p))}</span>
                        {p.stock_qty > 0 ? (
                          <span className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
                            <IconCheck className="w-3 h-3" /> In Stock
                          </span>
                        ) : (
                          <span className="text-[11px] text-red-600 font-semibold">Out of Stock</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
