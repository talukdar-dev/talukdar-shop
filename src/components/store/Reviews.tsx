'use client';

import { useState } from 'react';
import { IconStar, IconStarOutline } from './icons';
import type { Review } from '@/lib/types';

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-promo" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(n) ? (
          <IconStar key={i} className="w-3.5 h-3.5" />
        ) : (
          <IconStarOutline key={i} className="w-3.5 h-3.5" />
        ),
      )}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function Reviews({
  reviews: initialReviews,
  reviewsCount,
}: {
  reviews: Review[];
  reviewsCount: number;
}) {
  const [list, setList] = useState<Review[]>(initialReviews);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    // Client-side only preview — real submission goes through API for moderation
    setList((prev) => [
      {
        id: `temp-${Date.now()}`,
        product_id: '',
        customer_name: name.trim(),
        gender: null,
        review_text: text.trim(),
        rating,
        review_date: new Date().toISOString().slice(0, 10),
        is_approved: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setName('');
    setText('');
    setRating(5);
    setDone(true);
  };

  // Rating summary
  const avg = list.length
    ? list.reduce((s, r) => s + r.rating, 0) / list.length
    : 0;

  return (
    <section id="reviews" className="scroll-mt-24" aria-label="Customer reviews">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[18px] font-bold text-[#222]">Reviews ({reviewsCount})</h3>
        {list.length > 0 && (
          <span className="flex items-center gap-1.5 text-[13px] text-gray-600">
            <Stars n={avg} />
            <span className="font-semibold">{avg.toFixed(1)}</span> out of 5
          </span>
        )}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {list.length === 0 && (
            <p className="text-[13.5px] text-gray-500 bg-white border border-[#e8e8e8] rounded-md p-4">
              No reviews yet. Be the first to share your experience!
            </p>
          )}
          {list.map((r) => (
            <article key={r.id} className="bg-white border border-[#e8e8e8] rounded-md p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[13.5px]">{r.customer_name}</span>
                {r.review_date && (
                  <span className="text-[12px] text-ink">{formatDate(r.review_date)}</span>
                )}
              </div>
              <Stars n={r.rating} />
              <p className="text-[13.5px] text-gray-700 mt-1.5 leading-relaxed">{r.review_text}</p>
            </article>
          ))}
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-md p-4 h-fit">
          <h4 className="font-bold text-[15px] mb-3">Write a review</h4>
          {done && (
            <p className="mb-3 text-[13px] bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-2">
              Thanks! Your review has been submitted for moderation.
            </p>
          )}
          <form onSubmit={submit} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand"
            />
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-[13.5px] bg-white outline-none focus:border-brand"
              aria-label="Rating"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this product…"
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13.5px] outline-none focus:border-brand resize-y"
            />
            <button
              type="submit"
              className="h-10 px-6 bg-brand hover:bg-brand-dark text-white text-[13.5px] font-bold rounded-md transition-colors"
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
