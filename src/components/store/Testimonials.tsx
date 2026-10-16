import Link from 'next/link';
import type { TestimonialReview } from '@/lib/db';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${Math.round(rating * 10) / 10} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-[14px] ${i <= rating ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials({ reviews }: { reviews: TestimonialReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-6" aria-label="Customer reviews">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a]">
          What Our Customers Say
        </h2>
        <span className="text-[12.5px] text-ink">
          {reviews.length}+ verified reviews
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-md border border-[#e8e8e8] p-4 flex flex-col"
          >
            <Stars rating={r.rating} />
            <p className="text-[13px] text-gray-700 leading-relaxed mt-2 flex-1 line-clamp-4">
              “{r.review_text}”
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[12.5px] font-bold text-[#222]">{r.customer_name}</p>
              {r.product_slug && (
                <Link
                  href={`/product/${r.product_slug}`}
                  className="text-[11.5px] text-link hover:underline line-clamp-1"
                >
                  {r.product_name}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
