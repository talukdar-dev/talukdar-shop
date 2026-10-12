import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { getProducts } from '@/lib/db';
import type { Product } from '@/lib/types';
import Breadcrumb from '@/components/store/Breadcrumb';
import PCBuilderClient, { type BuilderRow } from '@/components/store/PCBuilderClient';

export const metadata: Metadata = {
  title: 'PC Builder — Build Your Custom PC',
  description:
    'Build your dream PC with Talukdar Shop PC Builder. Choose CPU, motherboard, RAM, storage, graphics card & more at the best price in Bangladesh.',
  alternates: { canonical: '/pc-builder' },
};

const ROW_DEFS = [
  { key: 'cpu', label: 'CPU', required: true, category: 'component' },
  { key: 'cooler', label: 'CPU Cooler', required: false, category: 'accessories' },
  { key: 'motherboard', label: 'Motherboard', required: true, category: 'component' },
  { key: 'ram', label: 'RAM', required: true, category: 'component' },
  { key: 'storage', label: 'Storage', required: true, category: 'component' },
  { key: 'gpu', label: 'Graphics Card', required: false, category: 'component' },
  { key: 'psu', label: 'Power Supply', required: false, category: 'component' },
  { key: 'casing', label: 'Casing', required: false, category: 'accessories' },
  { key: 'monitor', label: 'Monitor', required: false, category: 'monitor' },
  { key: 'keyboard', label: 'Keyboard', required: false, category: 'accessories' },
  { key: 'mouse', label: 'Mouse', required: false, category: 'accessories' },
];

export default async function PCBuilderPage() {
  'use cache';
  cacheLife('minutes');
  const cats = [...new Set(ROW_DEFS.map((r) => r.category))];
  const results = await Promise.all(
    cats.map((c) => getProducts({ categorySlug: c, perPage: 100 })),
  );
  const byCat: Record<string, Product[]> = {};
  cats.forEach((c, i) => {
    byCat[c] = results[i].items;
  });
  const rows: BuilderRow[] = ROW_DEFS.map((r) => ({
    key: r.key,
    label: r.label,
    required: r.required,
    products: byCat[r.category] ?? [],
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'PC Builder' }]} />
      <h1 className="text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mt-2">
        PC Builder — Build Your Custom PC
      </h1>
      <p className="text-[13.5px] text-ink mt-1 mb-4">
        Pick components for each part and see the live total. Items marked Required must be
        chosen before adding the build to your cart.
      </p>
      <PCBuilderClient rows={rows} />
    </>
  );
}
