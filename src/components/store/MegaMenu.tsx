'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Brand, Category } from '@/lib/types';
import { IconChevronDown, IconChevronRight, IconClose, IconMenu } from './icons';

interface Props {
  categories: Category[];
  catBrands: Record<string, Brand[]>;
}

export default function MegaMenu({ categories, catBrands }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="bg-brand text-white sticky top-0 z-40 shadow-[0_2px_10px_rgba(0,0,0,0.18)]" aria-label="Categories">
        <div className="px-3">
          <button
            className="lg:hidden flex items-center gap-2 py-2.5 font-semibold text-[14px]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open category menu"
          >
            <IconMenu className="w-5 h-5" /> All Categories
          </button>
          <ul className="hidden lg:flex items-stretch justify-center w-full">
            {categories.map((c) => {
              const brands = (catBrands[c.id] ?? []).slice(0, 8);
              return (
                <li key={c.id} className="relative group">
                  <Link
                    href={`/category/${c.slug}`}
                    className="flex items-center gap-1 px-3 xl:px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap hover:bg-brand-dark transition-colors"
                  >
                    {c.name}
                    {brands.length > 0 && <IconChevronDown className="w-3.5 h-3.5 opacity-70" />}
                  </Link>
                  {brands.length > 0 && (
                    <div className="absolute left-0 top-full hidden group-hover:block z-50 pt-0">
                      <div className="bg-white text-gray-800 shadow-xl border border-gray-100 rounded-b-md w-60 py-2">
                        {brands.map((b) => (
                          <Link
                            key={b.id}
                            href={`/search?brand=${b.slug}`}
                            className="flex items-center justify-between px-4 py-1.5 text-[13px] hover:bg-gray-50 hover:text-brand"
                          >
                            {b.name}
                            <IconChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </Link>
                        ))}
                        <Link
                          href={`/category/${c.slug}`}
                          className="block px-4 pt-2 mt-1 border-t border-gray-100 text-[13px] font-bold text-link hover:underline"
                        >
                          Show All {c.name}
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* mobile drawer */}
      <div
        className={`drawer-overlay fixed inset-0 bg-black/50 z-50 lg:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`drawer-panel fixed inset-y-0 left-0 w-[300px] bg-white z-50 lg:hidden flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Mobile category menu"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-brand text-white">
          <span className="font-bold">All Categories</span>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto thin-scroll divide-y divide-gray-100">
          {categories.map((c) => {
            const brands = catBrands[c.id] ?? [];
            const open = openCat === c.id;
            return (
              <li key={c.id}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-gray-800"
                  onClick={() => setOpenCat(open ? null : c.id)}
                >
                  {c.name}
                  <IconChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="bg-gray-50 pb-2">
                    {brands.map((b) => (
                      <Link
                        key={b.id}
                        href={`/search?brand=${b.slug}`}
                        onClick={handleNavClick}
                        className="block px-6 py-2 text-[13px] text-gray-600 hover:text-brand"
                      >
                        {b.name}
                      </Link>
                    ))}
                    <Link
                      href={`/category/${c.slug}`}
                      onClick={handleNavClick}
                      className="block px-6 py-2 text-[13px] font-bold text-link"
                    >
                      Show All {c.name}
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
