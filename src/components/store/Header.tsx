'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart';
import { taka } from '@/lib/format';
import SmartImage from './SmartImage';
import { IconCart, IconPhone, IconSearch } from './icons';
import type { SiteSettings } from '@/lib/types';

interface SearchHit {
  slug: string;
  name: string;
  price: number;
  image: string;
}

function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setHits(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={boxRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={submit} className="flex" role="search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          type="text"
          placeholder="Search"
          autoComplete="off"
          aria-label="Search products"
          className="w-full h-10 px-4 text-[14px] text-gray-800 bg-white border-2 border-brand border-r-0 rounded-l-md outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="h-10 px-5 bg-brand hover:bg-brand-dark text-white rounded-r-md transition-colors flex items-center"
        >
          <IconSearch className="w-5 h-5" />
        </button>
      </form>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-[380px] overflow-y-auto thin-scroll">
          {loading && <p className="px-4 py-3 text-sm text-gray-500">Searching…</p>}
          {!loading && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No products found.</p>
          )}
          {hits.map((h) => (
            <button
              key={h.slug}
              onClick={() => {
                setOpen(false);
                router.push(`/product/${h.slug}`);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
            >
              <span className="relative w-10 h-10 shrink-0">
                <SmartImage src={h.image} alt={h.name} fill className="object-contain" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] text-gray-800 truncate">{h.name}</span>
                <span className="block text-[13px] font-bold text-brand">{taka(h.price)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ settings }: { settings: SiteSettings }) {
  const { count, setDrawerOpen, mounted } = useCart();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1280px] mx-auto px-3 py-3 flex items-center gap-3 sm:gap-6">
        <Link href="/" className="shrink-0 leading-none" aria-label="Talukdar Shop home">
          <SmartImage
            src="https://res.cloudinary.com/w1qo6mno/image/upload/talukdar-shop/talukdar-shop-logo.png"
            alt="Talukdar Shop"
            width={190}
            height={52}
            className="h-[42px] sm:h-[52px] w-auto"
            priority
          />
        </Link>

        <SearchBar />

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            <IconPhone className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <a href={`tel:${settings.hotline}`} className="block text-[18px] font-black text-navy">
              {settings.hotline}
            </a>
            <span className="block text-[11px] text-ink">{settings.hotline_hours}</span>
          </span>
        </div>

        <a
          href={`tel:${settings.hotline}`}
          className="md:hidden shrink-0 w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center"
          aria-label="Call us"
        >
          <IconPhone className="w-5 h-5" />
        </a>

        <button
          onClick={() => setDrawerOpen(true)}
          className="relative shrink-0 flex items-center gap-2 h-10 px-3 sm:px-4 bg-navy hover:bg-navy-dark text-white rounded-md transition-colors"
          aria-label="Open cart"
        >
          <IconCart className="w-5 h-5" />
          <span className="hidden sm:inline text-[13px] font-semibold">Cart</span>
          {mounted && count > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
