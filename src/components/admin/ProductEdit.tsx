'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { Spinner } from '@/components/admin/UI';
import type { Brand, Category, Product } from '@/lib/types';

export default function ProductEdit({ id }: { id: string }) {
  const isNew = id === 'new';
  const [data, setData] = useState<{
    product: Partial<Product>;
    categories: Category[];
    brands: Brand[];
  } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes, bRes] = await Promise.all([
          isNew
            ? Promise.resolve(null)
            : fetch(`/api/admin/products/${id}`, { cache: 'no-store' }),
          fetch('/api/admin/categories', { cache: 'no-store' }),
          fetch('/api/admin/brands', { cache: 'no-store' }),
        ]);
        let product: Partial<Product> = {};
        if (pRes) {
          if (pRes.status === 404) {
            setMissing(true);
            return;
          }
          const pj = await pRes.json();
          product = pj.item ?? {};
        }
        const cj = await cRes.json();
        const bj = await bRes.json();
        setData({
          product,
          categories: cj.items ?? [],
          brands: bj.items ?? [],
        });
      } catch {
        setMissing(true);
      }
    })();
  }, [id, isNew]);

  if (missing) notFound();
  if (!data) return <Spinner />;

  return (
    <ProductForm
      initial={data.product}
      categories={data.categories}
      brands={data.brands}
      isNew={isNew}
    />
  );
}
