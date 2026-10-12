import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getBrands, getCategories, getProducts, getSettings } from '@/lib/db';
import Hero from '@/components/store/Hero';
import CategoryTiles from '@/components/store/CategoryTiles';
import FlashDealsSection from '@/components/store/FlashDealsSection';
import SectionBlock from '@/components/store/SectionBlock';
import TrustStrip from '@/components/store/TrustStrip';
import { IconPin, IconSearch, IconStore } from '@/components/store/icons';


export const metadata: Metadata = {
  title: 'Talukdar Shop — Best Tech Shop in Bangladesh',
  description:
    'Buy laptops, desktops, monitors, PC components, gadgets, mobiles & accessories at the best price in Bangladesh. 100% genuine products, official warranty, 0% EMI & fastest delivery.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  'use cache';
  cacheLife('minutes');
  const [categories, brands, settings] = await Promise.all([
    getCategories(),
    getBrands(),
    getSettings(),
  ]);

  // Admin-configurable homepage sections (fallback to defaults)
  const configured = settings.homepage_sections?.length
    ? settings.homepage_sections
    : [
        { title: 'Best Air Fryer Shop in Bangladesh', category_slug: 'air-fryer' },
        { title: 'Best Rice Cooker Shop In Bangladesh', category_slug: 'rice-cooker' },
        { title: 'Top Fan Shop In Bangladesh', category_slug: 'ceiling-fan' },
        { title: 'Best Light Shop In Bangladesh', category_slug: 'light' },
        { title: 'Best Iron Shop In Bangladesh', category_slug: 'iron' },
        { title: 'Best Blender Shop In Bangladesh', category_slug: 'blender' },
      ];

  const sectionProducts = await Promise.all(
    configured.map((s) => getProducts({ categorySlug: s.category_slug, perPage: 10 })),
  );

  // New arrivals — shows latest products regardless of category
  const newArrivals = await getProducts({ perPage: 10, sort: 'newest' });

  return (
    <>
      <h1 className="sr-only">Talukdar Shop — Best Tech Shop in Bangladesh</h1>

      <Hero />

      <CategoryTiles categories={categories} />

      {/* stores strip */}
      <section id="stores" className="bg-navy text-white rounded-md px-4 py-6 sm:px-8 flex flex-col md:flex-row items-center gap-4 scroll-mt-24">
        <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <IconStore className="w-6 h-6" />
        </span>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-[19px] font-bold">Visit Our Store &amp; Get Your Desired Tech Product!</h2>
          <p className="text-[13px] text-white/70 mt-0.5">
            Experience hands-on shopping with expert guidance at our physical store.
          </p>
        </div>
        <form
          action="/search"
          method="get"
          className="flex w-full md:w-auto"
          role="search"
          aria-label="Store search"
        >
          <input
            name="q"
            placeholder="Search products…"
            className="h-10 px-3 rounded-l-md text-[13px] text-gray-800 w-full md:w-56 outline-none"
            aria-label="Search products"
          />
          <button
            type="submit"
            aria-label="Search"
            className="h-10 px-4 bg-brand hover:bg-brand-dark rounded-r-md transition-colors"
          >
            <IconSearch className="w-5 h-5" />
          </button>
        </form>
        <Link
          href="/#stores"
          className="flex items-center gap-1.5 text-[13.5px] font-bold text-brand-orange hover:underline whitespace-nowrap"
        >
          <IconPin className="w-4 h-4" /> Find Our Store
        </Link>
      </section>

      <FlashDealsSection />

      {newArrivals.items.length > 0 && (
        <SectionBlock
          minItems={1}
          title="New Arrivals"
          href="/search?sort=newest"
          products={newArrivals.items}
        />
      )}

      {configured.map((s, i) => (
        <SectionBlock
          key={`${s.category_slug}-${i}`}
          minItems={4}
          title={s.title}
          href={`/category/${s.category_slug}`}
          products={sectionProducts[i].items}
        />
      ))}

      {/* brand strip */}
      {brands.length > 0 && (
        <section id="brands" className="bg-white rounded-md border border-[#e8e8e8] p-3 sm:p-4 scroll-mt-24" aria-label="Top brands">
          <h2 className="text-[17px] sm:text-[19px] font-bold text-[#222] border-l-4 border-brand pl-2.5 mb-3">
            Top Brands
          </h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/search?brand=${b.slug}`}
                className="px-4 py-2 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-full hover:border-brand hover:text-brand transition-colors"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO text block */}
      <section id="about" className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-6 scroll-mt-24">
        <h2 className="text-[18px] sm:text-[20px] font-bold text-[#222] mb-3">
          Trusted Online Shopping in Bangladesh at Talukdar Shop
        </h2>
        <div className="text-[13.5px] text-ink leading-relaxed space-y-3">
          <p>
            Talukdar Shop is one of the most trusted online tech retailers in Bangladesh, offering
            a wide range of laptops, desktop PCs, monitors, PC components, printers, software,
            gadgets, mobile phones and accessories at the best prices. Every product we sell is
            100% genuine, sourced through official channels and backed by official warranty
            support across the country.
          </p>
          <p>
            Whether you are a student looking for an affordable laptop, a gamer building a custom
            PC, or a business setting up an entire office, our catalog covers every budget and
            use case. Use the PC Builder tool to assemble your dream configuration, compare
            prices across brands, and check out with cash on delivery, mobile banking or 0% EMI
            for up to 12 months on major bank cards.
          </p>
          <p>
            With fast delivery inside Dhaka and reliable courier service nationwide, plus a
            dedicated after-sales support team reachable at {settings.hotline}, Talukdar Shop
            makes tech shopping simple, safe and affordable for everyone in Bangladesh.
          </p>
        </div>
      </section>

      <TrustStrip />
    </>
  );
}
