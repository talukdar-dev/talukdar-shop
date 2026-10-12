'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Banner } from '@/lib/types';
import SmartImage from './SmartImage';
import { IconChevronLeft, IconChevronRight } from './icons';

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (i: number) => setIndex(((i % banners.length) + banners.length) % banners.length),
    [banners.length],
  );

  useEffect(() => {
    if (banners.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [banners.length]);

  if (banners.length === 0) return null;
  const active = banners[index];

  return (
    <div
      className="relative rounded-md overflow-hidden bg-white border border-[#e8e8e8] aspect-[16/6] sm:aspect-[16/5] group"
      onMouseEnter={() => timer.current && clearInterval(timer.current)}
      onMouseLeave={() => {
        if (banners.length > 1 && !timer.current) {
          timer.current = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
        }
      }}
    >
      <Link
        key={active.id}
        href={active.link}
        className="hero-slide-active absolute inset-0"
        aria-label={active.title}
      >
        <SmartImage
          src={active.image}
          alt={active.title}
          fill
          sizes="(max-width: 1024px) 100vw, 960px"
          className="object-cover"
          priority={index === 0}
        />
      </Link>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IconChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => go(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2 bg-white/70 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
