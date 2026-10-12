import Link from 'next/link';
import { getBanners } from '@/lib/db';
import HeroCarousel from './HeroCarousel';
import SmartImage from './SmartImage';

export default async function Hero() {
  const [heroes, sides] = await Promise.all([getBanners('hero'), getBanners('side')]);

  return (
    <section className="grid lg:grid-cols-4 gap-3" aria-label="Promotions">
      <div className="lg:col-span-3 min-w-0">
        <HeroCarousel banners={heroes} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        {sides.slice(0, 2).map((b) => (
          <Link
            key={b.id}
            href={b.link}
            className="relative block rounded-md overflow-hidden bg-white border border-[#e8e8e8] aspect-[16/8] lg:aspect-auto lg:min-h-[120px]"
            aria-label={b.title}
          >
            <SmartImage src={b.image} alt={b.title} fill className="object-cover" />
          </Link>
        ))}
      </div>
    </section>
  );
}
