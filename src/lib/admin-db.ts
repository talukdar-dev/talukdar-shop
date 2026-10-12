// Admin data layer — writes REQUIRE Supabase (service-role key).
// Reads fall back to demo seed when Supabase is not configured; writes throw
// a clear error so the UI can show a "connect database" banner.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Banner, Brand, Category, Coupon, Order, OrderStatus, Product, SiteSettings,
} from './types';
import {
  banners as seedBanners,
  brands as seedBrands,
  categories as seedCategories,
  products as seedProducts,
  siteSettings as seedSettings,
} from './seed';
import { getOrders } from './db';
import { revalidateTag } from 'next/cache';

export const NOT_CONFIGURED =
  'Supabase not configured — connect database to enable admin writes';

let adminClient: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(NOT_CONFIGURED);
  adminClient = createClient(url, key);
  return adminClient;
}

export const isDbConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

function clean<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row } as Record<string, unknown>;
  delete out.category;
  delete out.brand;
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out as T;
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---------- products ----------
export async function getProductsAdmin(): Promise<Product[]> {
  if (!isDbConfigured()) return [...seedProducts];
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProductAdmin(id: string): Promise<Product | null> {
  if (!isDbConfigured()) return seedProducts.find((p) => p.id === id) ?? null;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Product) ?? null;
}

export async function upsertProduct(
  input: Partial<Product> & { name: string; slug: string },
): Promise<Product> {
  const sb = supabaseAdmin();
  const row = clean({
    ...input,
    id: input.id || newId('p'),
    rating: input.rating ?? 0,
    reviews_count: input.reviews_count ?? 0,
    created_at: input.created_at ?? new Date().toISOString(),
  });
  let { data, error } = await sb
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  // Fallback: if product_type / variants columns don't exist yet (migration pending),
  // retry without them so product save still works.
  if (error && (error.message.includes('product_type') || error.message.includes('variants'))) {
    const { product_type, variants, ...rowWithoutNewCols } = row as Record<string, unknown>;
    const retry = await sb
      .from('products')
      .upsert(rowWithoutNewCols, { onConflict: 'id' })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(error.message);
  return data as Product;
  revalidateTag('products', 'max');
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateTag('products', 'max');
}

// ---------- categories ----------
export async function getCategoriesAdmin(): Promise<Category[]> {
  if (!isDbConfigured()) return [...seedCategories].sort((a, b) => a.sort_order - b.sort_order);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('categories').select('*').order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function upsertCategory(
  input: Partial<Category> & { name: string; slug: string },
): Promise<Category> {
  const sb = supabaseAdmin();
  const row = clean({ ...input, id: input.id || newId('c') });
  const { data, error } = await sb
    .from('categories')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
  revalidateTag('catalog', 'max');
  revalidateTag('products', 'max');
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateTag('catalog', 'max');
  revalidateTag('products', 'max');
}

// ---------- brands ----------
export async function getBrandsAdmin(): Promise<Brand[]> {
  if (!isDbConfigured()) return [...seedBrands];
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('brands').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Brand[];
}

export async function upsertBrand(
  input: Partial<Brand> & { name: string; slug: string },
): Promise<Brand> {
  const sb = supabaseAdmin();
  const row = clean({ ...input, id: input.id || newId('b') });
  const { data, error } = await sb
    .from('brands')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Brand;
  revalidateTag('catalog', 'max');
  revalidateTag('products', 'max');
}

export async function deleteBrand(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from('brands').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateTag('catalog', 'max');
  revalidateTag('products', 'max');
}

// ---------- banners ----------
export async function getBannersAdmin(): Promise<Banner[]> {
  if (!isDbConfigured()) return [...seedBanners].sort((a, b) => a.sort_order - b.sort_order);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('banners').select('*').order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Banner[];
}

export async function upsertBanner(
  input: Partial<Banner> & { title: string },
): Promise<Banner> {
  const sb = supabaseAdmin();
  const row = clean({ ...input, id: input.id || newId('bn') });
  const { data, error } = await sb
    .from('banners')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Banner;
  revalidateTag('banners', 'max');
}

export async function deleteBanner(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidateTag('banners', 'max');
}

// ---------- coupons ----------
export async function getCouponsAdmin(): Promise<Coupon[]> {
  if (!isDbConfigured()) return [];
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('coupons').select('*').order('code');
  if (error) throw new Error(error.message);
  return (data ?? []) as Coupon[];
}

export async function upsertCoupon(
  input: Partial<Coupon> & { code: string },
): Promise<Coupon> {
  const sb = supabaseAdmin();
  const row = clean({
    ...input,
    id: input.id || newId('cp'),
    code: input.code.toUpperCase(),
  });
  const { data, error } = await sb
    .from('coupons')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------- orders ----------
export async function getOrdersAdmin(limit = 200): Promise<Order[]> {
  return getOrders(limit);
}

export async function getOrderAdmin(id: string): Promise<Order | null> {
  const orders = await getOrdersAdmin(500);
  return orders.find((o) => o.id === id || o.order_no === id) ?? null;
}

export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const { updateOrderStatus } = await import('./db');
  await updateOrderStatus(id, status);
}

// ---------- settings ----------
export async function saveSettings(settings: SiteSettings): Promise<void> {
  const sb = supabaseAdmin();
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await sb.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidateTag('site', 'max');
}

// ---------- stats ----------
export interface AdminStats {
  products: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
  lowStock: { id: string; name: string; stock_qty: number }[];
}

export async function getStats(): Promise<AdminStats> {
  const products = await getProductsAdmin();
  const orders = await getOrdersAdmin(1000);
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0);
  return {
    products: products.length,
    orders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    revenue,
    lowStock: products
      .filter((p) => p.stock_qty <= 5)
      .map((p) => ({ id: p.id, name: p.name, stock_qty: p.stock_qty }))
      .slice(0, 10),
  };
}

export { seedSettings };
