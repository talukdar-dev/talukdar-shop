import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getBanners, getProducts } from '@/lib/db';
import FlashDealsSection from '@/components/store/FlashDealsSection';
import SmartImage from '@/components/store/SmartImage';
import Breadcrumb from '@/components/store/Breadcrumb';


export const metadata: Metadata = {
  title: 'Latest Offers',
  description:
    'Explore the latest offers, promo campaigns and flash deals at Talukdar Shop — best prices on home appliances.',
  alternates: { canonical: '/offers' },
};

export default async function OffersPage() {
  'use cache';
  cacheLife('minutes');
  const [promos, all] = await Promise.all([getBanners('promo'), getBanners()]);
  const cards = promos.length > 0 ? promos : all.filter((b) => b.position !== 'hero');

  return (
    <>
      <Breadcrumb items={[{ label: 'Offers' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">Latest Offers</h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        Grab the hottest promo campaigns and bundle deals before they run out.
      </p>

      {cards.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {cards.map((b) => (
            <Link
              key={b.id}
              href={b.link}
              className="group relative block rounded-md overflow-hidden bg-white border border-[#e8e8e8] aspect-[16/9] hover:shadow-md transition-shadow"
            >
              <SmartImage
                src={b.image}
                alt={b.title}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover group-hover:scale-[1.02] transition-transform"
              />
              <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                <span className="block text-white font-bold text-[15px]">{b.title}</span>
                {b.subtitle && (
                  <span className="block text-white/80 text-[12.5px]">{b.subtitle}</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}

      <FlashDealsSection />
    </>
  );
}
