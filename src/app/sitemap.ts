import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://talukdar-shop.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ items: products }, categories] = await Promise.all([
    getProducts({ perPage: 1000 }),
    getCategories(),
  ]);

  const staticPages = [
    '',
    '/offers',
    '/pc-builder',
    '/emi',
    '/cart',
    '/checkout',
    '/search',
    '/account/login',
    '/account/register',
  ];

  return [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}${p || '/'}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: p === '' ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
