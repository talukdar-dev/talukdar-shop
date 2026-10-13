import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { getBrands, getCategories, getCategoryBrands, getSettings } from '@/lib/db';
import TopBar from '@/components/store/TopBar';
import Header from '@/components/store/Header';
import MegaMenu from '@/components/store/MegaMenu';
import Footer from '@/components/store/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import NavigationProgress from '@/components/store/NavigationProgress';
import WhatsAppButton from '@/components/store/WhatsAppButton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Talukdar Shop — Best Home Appliance Shop in Bangladesh',
    template: '%s | Talukdar Shop',
  },
  description:
    'Talukdar Shop is the best online home appliance shop in Bangladesh. Buy air fryers, rice cookers, fans, cookware & home essentials at the best price with fast delivery.',
  openGraph: {
    type: 'website',
    siteName: 'Talukdar Shop',
    title: 'Talukdar Shop — Best Home Appliance Shop in Bangladesh',
    description:
      'Buy air fryers, rice cookers, fans, cookware & home essentials at the best price in Bangladesh.',
  },
};

async function loadLayoutData() {
  'use cache';
  cacheLife('minutes');
  const [settings, categories, brands, catBrands] = await Promise.all([
    getSettings(),
    getCategories(),
    getBrands(),
    getCategoryBrands(),
  ]);
  return { settings, categories, brands, catBrands };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories, catBrands } = await loadLayoutData();

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

  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Talukdar Shop',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/logo.png`,
    telephone: settings.hotline,
    priceRange: '৳৳',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressLocality: 'Sakhipur',
      addressRegion: 'Tangail',
      addressCountry: 'BD',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ],
      opens: '09:00',
      closes: '22:00',
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
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
      <WhatsAppButton number={settings.whatsapp_number} />
    </>
  );
}
