import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { getBrands, getCategories, getProducts, getSettings } from '@/lib/db';
import type { Brand } from '@/lib/types';
import TopBar from '@/components/store/TopBar';
import Header from '@/components/store/Header';
import MegaMenu from '@/components/store/MegaMenu';
import Footer from '@/components/store/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import NavigationProgress from '@/components/store/NavigationProgress';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Talukdar Shop — Best Tech Shop in Bangladesh',
    template: '%s | Talukdar Shop',
  },
  description:
    'Talukdar Shop is the best online tech shop in Bangladesh. Buy laptops, desktops, monitors, components, gadgets & accessories at the best price with official warranty, EMI & fast delivery.',
  openGraph: {
    type: 'website',
    siteName: 'Talukdar Shop',
    title: 'Talukdar Shop — Best Tech Shop in Bangladesh',
    description:
      'Buy laptops, desktops, monitors, components, gadgets & accessories at the best price in Bangladesh.',
  },
};

async function loadLayoutData() {
  'use cache';
  cacheLife('minutes');
  const [settings, categories, brands] = await Promise.all([
    getSettings(),
    getCategories(),
    getBrands(),
  ]);
  const { items: allProducts } = await getProducts({ perPage: 500 });
  return { settings, categories, brands, allProducts };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories, brands, allProducts } = await loadLayoutData();
  const catBrands: Record<string, Brand[]> = {};
  for (const c of categories) {
    const seen = new Set<string>();
    catBrands[c.id] = [];
    for (const p of allProducts) {
      if (p.category_id === c.id && p.brand && !seen.has(p.brand.id)) {
        seen.add(p.brand.id);
        catBrands[c.id].push(p.brand);
      }
    }
  }

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Talukdar Shop',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.hotline,
      contactType: 'customer service',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressCountry: 'BD',
    },
  };

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Talukdar Shop',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <TopBar />
      <NavigationProgress />
      <Header settings={settings} />
      <MegaMenu categories={categories} catBrands={catBrands} />
      <main className="flex-1 w-full min-w-0">
        <div className="max-w-[1280px] mx-auto px-3 py-4 space-y-4 overflow-x-clip">{children}</div>
      </main>
      <Footer settings={settings} />
      <CartDrawer />
    </>
  );
}
