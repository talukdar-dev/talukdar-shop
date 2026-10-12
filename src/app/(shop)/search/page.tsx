import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getBrands, getProducts } from '@/lib/db';
import Breadcrumb from '@/components/store/Breadcrumb';
import ProductCard from '@/components/store/ProductCard';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Query-driven page: always rendered dynamically per request.
export const instant = false;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = one(sp.q) ?? '';
  const brand = one(sp.brand) ?? '';
  const title = q
    ? `Search results for "${q}" | Talukdar Shop`
    : brand
      ? `${brand} products | Talukdar Shop`
      : 'Search | Talukdar Shop';
  return { title, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const q = one(sp.q) ?? '';
  const brandSlug = one(sp.brand) || undefined;

  const brands = await getBrands();
  const brand = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;

  const { items, total } = q || brandSlug
    ? await getProducts({ q: q || undefined, brandSlug, perPage: 48 })
    : { items: [], total: 0 };

  const heading = q
    ? `Search results for "${q}"`
    : brand
      ? `${brand.name} products`
      : 'Search';

  return (
    <>
      <Breadcrumb items={[{ label: 'Search' }]} />
      <h1 className="text-[20px] font-bold text-[#1a1a1a] mt-2">{heading}</h1>
      <p className="text-[13px] text-ink mt-1 mb-4" role="status">
        {total} product{total === 1 ? '' : 's'} found
      </p>
      {items.length === 0 ? (
        <div className="bg-white rounded-md border border-[#e8e8e8] p-10 text-center">
          <p className="font-bold text-[16px] mb-1">No products found</p>
          <p className="text-[13.5px] text-ink">Try a different keyword or browse the categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showSpecs />
          ))}
        </div>
      )}
    </>
  );
}
