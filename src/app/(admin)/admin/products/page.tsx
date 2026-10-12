'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taka } from '@/lib/format';
import type { Product } from '@/lib/types';
import {
  Badge, ConfirmButton, DataTable, DbNotice, EmptyState, PageHeader,
  PrimaryButton, Spinner, TextInput,
} from '@/components/admin/UI';

export default function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setDemo(!!data.demo);
        setError(data.error || 'Failed to load');
        setItems([]);
      } else {
        setItems(data.items);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 350);
    return () => clearTimeout(t);
  }, [q, load]);

  async function remove(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      {demo && <DbNotice />}
      <PageHeader
        title="Products"
        sub={`${items.length} products`}
        actions={
          <>
            <div className="w-64">
              <TextInput
                placeholder="Search name, SKU, slug…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Link href="/admin/products/new">
              <PrimaryButton>Add Product</PrimaryButton>
            </Link>
          </>
        }
      />
      {error && !demo && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {loading ? (
        <Spinner />
      ) : (
        <DataTable<Product>
          rows={items}
          emptyText="No products found."
          columns={[
            {
              key: 'product',
              header: 'Product',
              render: (p) => (
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">No img</span>
                    )}
                  </span>
                  <span>
                    <span className="block max-w-56 truncate font-medium text-slate-900">{p.name}</span>
                    <span className="block text-xs text-slate-400">SKU: {p.sku}</span>
                  </span>
                </span>
              ),
            },
            {
              key: 'cat',
              header: 'Category',
              render: (p) => <span className="text-slate-600">{p.category?.name ?? '—'}</span>,
            },
            {
              key: 'brand',
              header: 'Brand',
              render: (p) => <span className="text-slate-600">{p.brand?.name ?? '—'}</span>,
            },
            {
              key: 'price',
              header: 'Price',
              render: (p) => <span className="font-semibold">{taka(p.price)}</span>,
            },
            {
              key: 'stock',
              header: 'Stock',
              render: (p) => (
                <span className={p.stock_qty <= 5 ? 'font-bold text-red-600' : ''}>{p.stock_qty}</span>
              ),
            },
            {
              key: 'flags',
              header: 'Flags',
              render: (p) => (
                <span className="flex flex-wrap gap-1">
                  {p.is_featured && <Badge text="Featured" />}
                  {p.is_new && <Badge text="New" />}
                  {p.is_flash_deal && <Badge text="Flash" />}
                  {!p.is_active && <Badge text="Inactive" />}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              className: 'whitespace-nowrap',
              render: (p) => (
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <ConfirmButton onConfirm={() => remove(p.id)} />
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
