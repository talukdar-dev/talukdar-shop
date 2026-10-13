'use client';

import { useEffect, useRef } from 'react';

/** Renders product HTML description with responsive tables (horizontal scroll on mobile). */
export default function ProductDescription({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll('table').forEach((t) => {
      if (!t.parentElement?.classList.contains('table-wrap')) {
        const w = document.createElement('div');
        w.className = 'table-wrap';
        t.parentNode?.insertBefore(w, t);
        w.appendChild(t);
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="product-desc text-[13.5px] text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
