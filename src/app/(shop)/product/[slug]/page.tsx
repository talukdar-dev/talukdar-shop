import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { getProduct } from '@/lib/db';
import { effectivePrice, taka } from '@/lib/format';
import Breadcrumb from '@/components/store/Breadcrumb';
import BuyBox from '@/components/store/BuyBox';
import ProductGallery from '@/components/store/ProductGallery';
import QA from '@/components/store/QA';
import RelatedProducts from '@/components/store/RelatedProducts';
import Reviews from '@/components/store/Reviews';
import SpecTable from '@/components/store/SpecTable';


interface Props {
  params: Promise<{ slug: string }>;
}

/** Timed-revalidation data loader: params are read outside the cached scope. */
async function loadProductData(slug: string) {
  'use cache';
  cacheLife('days');
  return getProduct(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found | Talukdar Shop' };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';
  return {
    title:
      product.meta_title ?? `${product.name} Price in Bangladesh | Talukdar Shop`,
    description:
      product.meta_description ??
      `Buy ${product.name} at the best price in Bangladesh (${taka(effectivePrice(product))}). 100% genuine, official warranty, EMI & fast delivery from Talukdar Shop.`,
    alternates: {
      canonical: `${siteUrl}/product/${slug}`,
    },
    openGraph: {
      title: product.name,
      images: product.images[0] && !product.images[0].startsWith('data:') ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProductData(slug);
  if (!product) notFound();

  const price = effectivePrice(product);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';
  const crumbs = [
    ...(product.category
      ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
      : []),
    ...(product.brand ? [{ label: product.brand.name }] : []),
  ];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    description: product.short_desc ?? product.name,
    image:
      product.images[0] && !product.images[0].startsWith('data:')
        ? [product.images[0]]
        : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews_count,
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: price,
      availability:
        product.stock_qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      ...(product.category
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: product.category.name,
              item: `${siteUrl}/category/${product.category.slug}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 3 : 2,
        name: product.name,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  const keySpecs = product.specs ? Object.entries(product.specs).slice(0, 6) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumb items={[...crumbs, { label: product.name }]} />

      <div className="grid md:grid-cols-2 gap-5 mt-3">
        <ProductGallery images={product.images} name={product.name} />
        <BuyBox product={product} />
      </div>

      {/* key features */}
      <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4" aria-label="Key features">
        <h2 className="text-[17px] font-bold text-[#222] border-l-4 border-brand pl-2.5 mb-3">
          Key Features
        </h2>
        {product.short_desc && (
          <p className="text-[13.5px] text-gray-700 leading-relaxed mb-2">{product.short_desc}</p>
        )}
        {keySpecs.length > 0 && (
          <ul className="list-disc list-inside text-[13.5px] text-gray-700 space-y-1">
            {keySpecs.map(([k, v]) => (
              <li key={k}>
                <span className="font-semibold">{k}:</span> {Array.isArray(v) ? v.join(', ') : v}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* specification */}
      <section className="mt-4" aria-label="Specification">
        <h2 className="text-[17px] font-bold text-[#222] border-l-4 border-brand pl-2.5 mb-3">
          Specification
        </h2>
        <SpecTable product={product} />
      </section>

      {/* latest price strip */}
      <section className="mt-4 bg-navy text-white rounded-md px-4 py-4 flex flex-wrap items-center justify-between gap-3" aria-label="Latest price">
        <div>
          <p className="text-[12px] uppercase tracking-wide text-white/60">Latest Price in Bangladesh</p>
          <p className="text-[20px] font-black mt-0.5">{product.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-black text-brand-orange">{taka(price)}</p>
          {product.old_price && product.old_price > price && (
            <p className="text-[13px] text-white/60 line-through">{taka(product.old_price)}</p>
          )}
        </div>
      </section>

      {/* description */}
      {product.description && (
        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-5 mt-4" aria-label="Description">
          <h2 className="text-[17px] font-bold text-[#222] border-l-4 border-brand pl-2.5 mb-3">
            Description
          </h2>
          <div
            className="text-[13.5px] text-gray-700 leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:list-inside"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      <div className="mt-6">
        <QA />
      </div>

      <div className="mt-6">
        <Reviews productName={product.name} reviewsCount={product.reviews_count} />
      </div>

      <div className="mt-6">
        <RelatedProducts product={product} />
      </div>

      <p className="mt-4 text-[12.5px] text-ink">
        See more:{' '}
        {product.category && (
          <Link href={`/category/${product.category.slug}`} className="text-link hover:underline">
            {product.category.name} price in Bangladesh
          </Link>
        )}
      </p>
    </>
  );
}
