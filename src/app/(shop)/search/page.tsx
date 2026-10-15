import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getBrands, getProducts } from '@/lib/db';
import Breadcrumb from '@/components/store/Breadcrumb';
import Filters from '@/components/store/Filters';
import Pagination from '@/components/store/Pagination';
import ProductCard from '@/components/store/ProductCard';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Query-driven page: always rendered dynamically per request.
export const instant = false;

const PER_PAGE_OPTIONS = [20, 24, 48, 75, 90];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = one(sp.q) ?? '';
  const brand = one(sp.brand) ?? '';
  // No "| Talukdar Shop" suffix here — the layout title template appends it.
  const title = q
    ? `Search results for "${q}"`
    : brand
      ? `${brand} products`
      : 'Search';
  return { title, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const q = one(sp.q) ?? '';
  const brandSlug = one(sp.brand) || undefined;

  const sortRaw = one(sp.sort);
  const sort =
    sortRaw === 'price-asc' || sortRaw === 'price-desc' ? sortRaw : undefined;
  const page = Math.max(1, parseInt(one(sp.page) ?? '1', 10) || 1);
  const perPageRaw = Number(one(sp.perPage) ?? 48);
  const perPage = PER_PAGE_OPTIONS.includes(perPageRaw) ? perPageRaw : 48;

  const brands = await getBrands();
  const brand = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;

  const { items, total } = q || brandSlug
    ? await getProducts({
        q: q || undefined,
        brandSlug,
        minPrice: one(sp.min) ? Number(one(sp.min)) : undefined,
        maxPrice: one(sp.max) ? Number(one(sp.max)) : undefined,
        inStock: one(sp.inStock) === '1' ? true : undefined,
        sort,
        page,
        perPage,
      })
    : { items: [], total: 0 };

  const plainParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val !== undefined) plainParams[k] = val;
  }

  const heading = q
    ? `Search results for "${q}"`
    : brand
      ? `${brand.name} products`
      : 'Search';

  return (
    <>
      <Breadcrumb items={[{ label: 'Search' }]} />
      <h1 className="text-[20px] font-bold text-[#1a1a1a] mt-2">{heading}</h1>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4 mt-4 items-start">
        <aside className="lg:sticky lg:top-16">
          <Suspense fallback={<div className="bg-white rounded-md border border-[#e8e8e8] p-4 text-sm text-ink">Loading filters…</div>}>
            <Filters brands={brands} total={total} />
          </Suspense>
        </aside>

        <div>
          <p className="text-[13px] text-ink mb-3" role="status">
            {total === 0
              ? 'No products found'
              : `Showing ${items.length === 0 ? 0 : (page - 1) * perPage + 1}–${
                  (page - 1) * perPage + items.length
                } of ${total} products`}
          </p>
          {items.length === 0 ? (
            <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center">
              <p className="font-bold text-[16px] mb-1">No products found</p>
              <p className="text-[13.5px] text-ink">Try a different keyword or browse the categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} showSpecs />
              ))}
            </div>
          )}
          <Pagination page={page} perPage={perPage} total={total} pathname="/search" params={plainParams} />
        </div>
      </div>
    </>
  );
}
