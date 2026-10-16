import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getCategories, getProducts, getRecentReviews, getSettings } from '@/lib/db';
import Hero from '@/components/store/Hero';
import CategoryTiles from '@/components/store/CategoryTiles';
import FlashDealsSection from '@/components/store/FlashDealsSection';
import SectionBlock from '@/components/store/SectionBlock';
import Testimonials from '@/components/store/Testimonials';
import TrustStrip from '@/components/store/TrustStrip';
import HomepageContent from '@/components/store/HomepageContent';


export const metadata: Metadata = {
  title: 'Talukdar Shop — Home Appliances & Digital Subscriptions in Bangladesh',
  description:
    'Buy air fryers, rice cookers, fans, cookware & home appliances plus Google AI Pro, digital subscriptions at the best price in Bangladesh. One shop for everything.',
  alternates: { canonical: '/' },
};

// Static generation: cache profile 'days' gives ~24h revalidation.
export default async function HomePage() {
  'use cache';
  cacheLife('days');
  const [categories, settings] = await Promise.all([
    getCategories(),
    getSettings(),
  ]);

  // Admin-configurable homepage sections (fallback to defaults)
  const configured = (settings.homepage_sections?.length
    ? settings.homepage_sections
    : [
        { title: 'Best Air Fryer in Bangladesh', category_slug: 'air-fryer' },
        { title: 'Best Rice Cooker in Bangladesh', category_slug: 'rice-cooker' },
        { title: 'Rechargeable Fan Collection', category_slug: 'dc-fan' },
        { title: 'Best Infrared Cooker in Bangladesh', category_slug: 'infrared-cooker' },
        { title: 'IPS & Power Backup', category_slug: 'battery' },
        { title: 'Water Geyser Collection', category_slug: 'water-heater' },
        { title: 'Blender & Mixer Grinder', category_slug: 'blender' },
        { title: 'Electric Kettle Collection', category_slug: 'electric-kettle' },
        { title: 'Microwave Oven Collection', category_slug: 'microwave-oven' },
        { title: 'Ceiling Fan Collection', category_slug: 'ceiling-fan' },
        { title: 'Room Heater for Winter', category_slug: 'room-heater' },
        { title: 'Solar Products', category_slug: 'solar' },
        { title: 'Pressure Cooker Collection', category_slug: 'pressure-cooker' },
        { title: 'Cookware Collection', category_slug: 'cookware' },
        { title: 'Multi Cooker Collection', category_slug: 'multi-cooker' },
        { title: 'Best Iron in Bangladesh', category_slug: 'iron' },
      ]
  ).filter((s) => s.enabled !== false);

  const sectionProducts = await Promise.all(
    configured.map((s) => getProducts({ categorySlug: s.category_slug, perPage: 10 })),
  );

  // New arrivals — shows latest products regardless of category
  const newArrivals = await getProducts({ perPage: 10, sort: 'newest' });

  // Best sellers, top rated, trending
  const [bestSellers, topRated, trending, testimonials] = await Promise.all([
    getProducts({ perPage: 10, sort: 'popular' }),
    getProducts({ perPage: 10, sort: 'rating' }),
    getProducts({ perPage: 10, featured: true }),
    getRecentReviews(8),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

  // Organization schema with aggregate rating for Google
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Talukdar Shop',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '219',
      bestRating: 5,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <h1 className="sr-only">Talukdar Shop — Best Home Appliance Shop in Bangladesh</h1>

      <Hero />

      <CategoryTiles categories={categories} />

      <FlashDealsSection />

      {newArrivals.items.length > 0 && (
        <SectionBlock
          minItems={1}
          title="New Arrivals"
          href="/search?sort=newest"
          products={newArrivals.items}
        />
      )}

      {bestSellers.items.length > 0 && (
        <SectionBlock
          minItems={1}
          title="Best Sellers"
          href="/search?sort=popular"
          products={bestSellers.items}
        />
      )}

      {trending.items.length > 0 && (
        <SectionBlock
          minItems={1}
          title="Trending Products"
          href="/search?featured=true"
          products={trending.items}
        />
      )}

      {topRated.items.length > 0 && (
        <SectionBlock
          minItems={1}
          title="Top Rated"
          href="/search?sort=rating"
          products={topRated.items}
        />
      )}

      {configured.map((s, i) => (
        <SectionBlock
          key={`${s.category_slug}-${i}`}
          minItems={1}
          title={s.title}
          href={`/category/${s.category_slug}`}
          products={sectionProducts[i].items}
        />
      ))}

      {/* SEO text block */}
      <HomepageContent />

      {/* internal linking: all categories + 1 Wikipedia external link */}
      <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4" aria-label="Shop by category">
        <h2 className="text-[15px] font-bold text-[#222] mb-2.5">Shop Home Appliances by Category</h2>
        <ul className="flex flex-wrap gap-2 mb-3">
          {categories.filter((c) => c.is_active !== false).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/category/${c.slug}`}
                className="inline-block text-[12.5px] font-medium text-link border border-[#e0e0e0] rounded-full px-3 py-1.5 hover:border-brand hover:text-brand transition-colors"
              >
                {c.name} price in Bangladesh
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[12.5px] text-ink">
          {'Learn more about '}
          <a
            href="https://en.wikipedia.org/wiki/Home_appliance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            home appliances
          </a>
          {' on Wikipedia.'}
        </p>
      </section>

      {/* customer reviews */}
      <Testimonials reviews={testimonials} />

      <TrustStrip />
    </>
  );
}
