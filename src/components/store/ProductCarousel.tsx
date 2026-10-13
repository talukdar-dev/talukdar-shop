'use client';

import { useRef, useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

interface Props {
  products: Product[];
}

/** Horizontally scrollable product row with arrow buttons (desktop) + swipe (mobile). */
export default function ProductCarousel({ products }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(':scope > div');
    const w = card ? card.offsetWidth + 12 : 400;
    el.scrollBy({ left: dir * w * 2, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1"
      >
        {products.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[168px] sm:w-[200px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll products left"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-14 items-center justify-center bg-white/95 border border-[#e0e0e0] rounded-r-md shadow-md text-[#444] hover:text-brand hover:border-brand transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll products right"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-14 items-center justify-center bg-white/95 border border-[#e0e0e0] rounded-l-md shadow-md text-[#444] hover:text-brand hover:border-brand transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
