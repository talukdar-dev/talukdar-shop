'use client';

import { useState } from 'react';
import { IconStar, IconStarOutline } from './icons';

interface Review {
  author: string;
  date: string;
  rating: number;
  text: string;
}

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

const seedFor = (name: string): Review[] => [
  {
    author: 'Rahim U.',
    date: '2026-09-18',
    rating: 5,
    text: `Genuine product, sealed pack. Delivery inside Dhaka took just one day. Very happy with this purchase of ${name}.`,
  },
  {
    author: 'Tanvir H.',
    date: '2026-08-30',
    rating: 4,
    text: 'Good price compared to other shops. Packaging could be slightly better, but the product itself is 100% original.',
  },
  {
    author: 'Nusrat J.',
    date: '2026-08-12',
    rating: 5,
    text: 'Ordered with EMI, process was smooth and support helped on the phone. Recommended seller.',
  },
];

export default function Reviews({
  productName,
  reviewsCount,
}: {
  productName: string;
  reviewsCount: number;
}) {
  const [list, setList] = useState<Review[]>(() => seedFor(productName));
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setList((prev) => [
      { author: name.trim(), date: new Date().toISOString().slice(0, 10), rating, text: text.trim() },
      ...prev,
    ]);
    setName('');
    setText('');
    setRating(5);
    setDone(true);
  };

  return (
    <section id="reviews" className="scroll-mt-24" aria-label="Customer reviews">
      <h3 className="text-[18px] font-bold text-[#222] mb-4">Reviews ({reviewsCount})</h3>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {list.map((r, i) => (
            <article key={i} className="bg-white border border-[#e8e8e8] rounded-md p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[13.5px]">{r.author}</span>
                <span className="text-[12px] text-ink">{r.date}</span>
              </div>
              <Stars n={r.rating} />
              <p className="text-[13.5px] text-gray-700 mt-1.5 leading-relaxed">{r.text}</p>
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
