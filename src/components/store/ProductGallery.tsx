'use client';

import { useState } from 'react';
import SmartImage from './SmartImage';

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const list = images.length > 0 ? images : [];
  const active = list[index] ?? '';

  return (
    <div>
      <div className="relative aspect-square bg-white rounded-md border border-[#e8e8e8] overflow-hidden">
        {active && (
          <SmartImage
            key={active}
            src={active}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-contain p-4"
            priority
          />
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative w-[72px] h-[72px] shrink-0 rounded-md border bg-white overflow-hidden ${
                i === index ? 'border-brand ring-1 ring-brand' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <SmartImage src={src} alt={`${name} thumbnail ${i + 1}`} fill className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
