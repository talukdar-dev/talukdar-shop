import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { getBrands, getCategory, getProducts } from '@/lib/db';
import Breadcrumb from '@/components/store/Breadcrumb';
import Filters from '@/components/store/Filters';
import Pagination from '@/components/store/Pagination';
import ProductCard from '@/components/store/ProductCard';


interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PER_PAGE_OPTIONS = [20, 24, 48, 75, 90];

// Filter-driven listing: always rendered dynamically per request.
export const instant = false;

interface CategoryFilter {
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'price-asc' | 'price-desc';
  page: number;
  perPage: number;
}

async function loadCategoryData(slug: string, f: CategoryFilter) {
  'use cache';
  cacheLife('minutes');
  const [category, result, brands] = await Promise.all([
    getCategory(slug),
    getProducts({
      categorySlug: slug,
      brandSlug: f.brandSlug,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      inStock: f.inStock,
      sort: f.sort,
      page: f.page,
      perPage: f.perPage,
    }),
    getBrands(),
  ]);
  return { category, items: result.items, total: result.total, brands };
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found | Talukdar Shop' };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdarshop.com';
  return {
    title: category.meta_title ?? `${category.name} Price in Bangladesh | Talukdar Shop`,
    description:
      category.meta_description ??
      category.description ??
      `Buy ${category.name} at the best price in Bangladesh from Talukdar Shop. 100% genuine products, official warranty & fast delivery.`,
    alternates: {
      canonical: `${siteUrl}/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const sp = await searchParams;

  const sortRaw = one(sp.sort);
  const sort =
    sortRaw === 'price-asc' || sortRaw === 'price-desc' ? sortRaw : undefined;
  const page = Math.max(1, parseInt(one(sp.page) ?? '1', 10) || 1);
  const perPageRaw = Number(one(sp.perPage) ?? 20);
  const perPage = PER_PAGE_OPTIONS.includes(perPageRaw) ? perPageRaw : 20;

  const { category, items, total, brands } = await loadCategoryData(slug, {
    brandSlug: one(sp.brand) || undefined,
    minPrice: one(sp.min) ? Number(one(sp.min)) : undefined,
    maxPrice: one(sp.max) ? Number(one(sp.max)) : undefined,
    inStock: one(sp.inStock) === '1' ? true : undefined,
    sort,
    page,
    perPage,
  });
  if (!category) notFound();

  const plainParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val !== undefined) plainParams[k] = val;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdar-shop.vercel.app';
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * perPage + i + 1,
      url: `${siteUrl}/product/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Breadcrumb items={[{ label: category.name }]} />

      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        Buy {category.name} at best price in Bangladesh
      </h1>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4 mt-4 items-start">
        <aside className="lg:sticky lg:top-16">
          <Suspense fallback={<div className="bg-white rounded-md border border-[#e8e8e8] p-4 text-sm text-ink">Loading filters…</div>}>
            <Filters brands={brands} total={total} />
          </Suspense>
        </aside>

        <div>
          <p className="text-[13px] text-ink mb-3" role="status">
            Showing {items.length === 0 ? 0 : (page - 1) * perPage + 1}–
            {(page - 1) * perPage + items.length} of {total} products
          </p>
          {items.length === 0 ? (
            <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center">
              <p className="font-bold text-[16px] mb-1">No products found</p>
              <p className="text-[13.5px] text-ink">
                Try adjusting your filters or search for something else.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} showSpecs />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            pathname={`/category/${slug}`}
            params={plainParams}
          />
        </div>
      </div>

      {(category.description || true) && (
        <section className="bg-white rounded-md border border-[#e8e8e8] p-4 sm:p-6 mt-4">
          <h2 className="text-[16px] font-bold text-[#222] mb-2">
            {category.name} Price in Bangladesh
          </h2>
          <div className="text-[13.5px] text-ink leading-relaxed space-y-2.5">
            {category.description ? (
              <p>{category.description}</p>
            ) : null}
            <p>
              Looking for the best {category.name.toLowerCase()} price in Bangladesh? Talukdar
              Shop offers 100% genuine {category.name.toLowerCase()} with official warranty at
              unbeatable prices. Order online for fast delivery inside Dhaka and anywhere in
              Bangladesh, with cash on delivery, mobile banking and 0% EMI up to 12 months on
              major bank cards. Compare models, check live stock status and grab the best deals
              on {category.name.toLowerCase()} only at Talukdar Shop — your trusted tech
              destination.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
