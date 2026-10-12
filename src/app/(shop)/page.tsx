import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { getCategories, getProducts, getSettings } from '@/lib/db';
import Hero from '@/components/store/Hero';
import CategoryTiles from '@/components/store/CategoryTiles';
import FlashDealsSection from '@/components/store/FlashDealsSection';
import SectionBlock from '@/components/store/SectionBlock';
import TrustStrip from '@/components/store/TrustStrip';
import HomepageContent from '@/components/store/HomepageContent';


export const metadata: Metadata = {
  title: 'Talukdar Shop — Best Tech Shop in Bangladesh',
  description:
    'Buy laptops, desktops, monitors, PC components, gadgets, mobiles & accessories at the best price in Bangladesh. 100% genuine products, official warranty, 0% EMI & fastest delivery.',
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
  const configured = settings.homepage_sections?.length
    ? settings.homepage_sections
    : [
        { title: 'Best Air Fryer in Bangladesh', category_slug: 'air-fryer' },
        { title: 'Best Rice Cooker in Bangladesh', category_slug: 'rice-cooker' },
        { title: 'Rechargeable Fan Collection', category_slug: 'dc-fan' },
        { title: 'Best Infrared Cooker in Bangladesh', category_slug: 'infrared-cooker' },
        { title: 'Pressure Cooker Collection', category_slug: 'pressure-cooker' },
        { title: 'Cookware Collection', category_slug: 'cookware' },
        { title: 'Multi Cooker Collection', category_slug: 'multi-cooker' },
        { title: 'Best Iron in Bangladesh', category_slug: 'iron' },
      ];

  const sectionProducts = await Promise.all(
    configured.map((s) => getProducts({ categorySlug: s.category_slug, perPage: 10 })),
  );

  // New arrivals — shows latest products regardless of category
  const newArrivals = await getProducts({ perPage: 10, sort: 'newest' });

  // Best sellers, top rated, trending
  const [bestSellers, topRated, trending] = await Promise.all([
    getProducts({ perPage: 10, sort: 'popular' }),
    getProducts({ perPage: 10, sort: 'rating' }),
    getProducts({ perPage: 10, featured: true }),
  ]);

  return (
    <>
      <h1 className="sr-only">Talukdar Shop — Best Tech Shop in Bangladesh</h1>

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

      <TrustStrip />
    </>
  );
}
