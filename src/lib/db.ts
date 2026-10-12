// Data layer — Supabase when configured AND reachable, demo seed fallback
// otherwise (missing env, missing tables, or any query error).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cacheLife, cacheTag } from 'next/cache';
import type {
  Banner, Brand, Category, Coupon, Order, OrderItem, OrderStatus,
  Product, SiteSettings,
} from './types';
import {
  banners as seedBanners,
  brands as seedBrands,
  categories as seedCategories,
  products as seedProducts,
  siteSettings as seedSettings,
} from './seed';

let client: SupabaseClient | null = null;
let checked = false;
let liveOk = false;

export function supabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

/** Run liveFn against Supabase; on any failure use seedFn instead. */
async function live<T>(
  seedFn: () => T | Promise<T>,
  liveFn: (sb: SupabaseClient) => Promise<T>,
): Promise<T> {
  const sb = supabase();
  if (!sb) return seedFn();
  try {
    const out = await liveFn(sb);
    liveOk = true;
    return out;
  } catch {
    liveOk = false;
    return seedFn();
  } finally {
    checked = true;
  }
}

/** True when env is set; call after a query for reachability. */
export const isLive = () => supabase() !== null;
export const dbReachable = () => checked && liveOk;

// ---------- helpers ----------
const withJoins = (p: Product): Product => {
  if (p.category || p.brand) return p;
  return {
    ...p,
    category: seedCategories.find((c) => c.id === p.category_id),
    brand: seedBrands.find((b) => b.id === p.brand_id),
  };
};

// ---------- settings ----------
export async function getSettings(): Promise<SiteSettings> {
  'use cache';
  cacheLife('days');
  cacheTag('site');
  return live(
    async () => seedSettings,
    async (sb) => {
      const { data, error } = await sb.from('settings').select('key,value');
      if (error || !data || data.length === 0) return seedSettings;
      const out = { ...seedSettings } as Record<string, unknown>;
      for (const row of data) out[row.key] = row.value;
      return out as unknown as SiteSettings;
    },
  );
}

// ---------- categories ----------
function seedCategoriesWithCounts(): Category[] {
  return seedCategories
    .filter((c) => c.is_active)
    .map((c) => ({
      ...c,
      product_count: seedProducts.filter(
        (p) => p.category_id === c.id && p.is_active,
      ).length,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function getCategories(): Promise<Category[]> {
  'use cache';
  cacheLife('days');
  cacheTag('catalog');
  return live(seedCategoriesWithCounts, async (sb) => {
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as Category[];
  });
}

export async function getCategory(slug: string): Promise<Category | null> {
  'use cache';
  cacheLife('days');
  cacheTag('catalog');
  return live(
    async () => seedCategories.find((c) => c.slug === slug) ?? null,
    async (sb) => {
      const { data, error } = await sb
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return (data as Category) ?? null;
    },
  );
}

// ---------- brands ----------
export async function getBrands(): Promise<Brand[]> {
  'use cache';
  cacheLife('days');
  cacheTag('catalog');
  return live(
    async () => seedBrands.filter((b) => b.is_active),
    async (sb) => {
      const { data, error } = await sb
        .from('brands')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  );
}

// ---------- products ----------
export interface ProductFilter {
  categorySlug?: string;
  brandSlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  flash?: boolean;
  isNew?: boolean;
  sort?: 'popular' | 'new' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  page?: number;
  perPage?: number;
}

function seedFilter(f: ProductFilter): Product[] {
  let list = seedProducts.filter((p) => p.is_active).map(withJoins);
  if (f.categorySlug) {
    const cat = seedCategories.find((c) => c.slug === f.categorySlug);
    list = list.filter((p) => p.category_id === cat?.id);
  }
  if (f.brandSlug) {
    const brand = seedBrands.find((b) => b.slug === f.brandSlug);
    list = list.filter((p) => p.brand_id === brand?.id);
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (f.minPrice) list = list.filter((p) => p.price >= f.minPrice!);
  if (f.maxPrice) list = list.filter((p) => p.price <= f.maxPrice!);
  if (f.inStock) list = list.filter((p) => p.stock_qty > 0);
  if (f.featured) list = list.filter((p) => p.is_featured);
  if (f.flash) list = list.filter((p) => p.is_flash_deal);
  if (f.isNew) list = list.filter((p) => p.is_new);
  switch (f.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'new': list.sort((a, b) => (a.is_new ? -1 : 1)); break;
    default: list.sort((a, b) => b.reviews_count - a.reviews_count);
  }
  return list;
}

export async function getProducts(
  f: ProductFilter = {},
): Promise<{ items: Product[]; total: number }> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  const page = f.page ?? 1;
  const perPage = f.perPage ?? 24;
  return live(
    async () => {
      const all = seedFilter(f);
      return {
        items: all.slice((page - 1) * perPage, page * perPage),
        total: all.length,
      };
    },
    async (sb) => {
      let q = sb
        .from('products')
        .select('*, category:categories(*), brand:brands(*)', { count: 'exact' })
        .eq('is_active', true);
      if (f.categorySlug) {
        const cat = await getCategory(f.categorySlug);
        if (cat) q = q.eq('category_id', cat.id);
      }
      if (f.brandSlug) {
        const brands = await getBrands();
        const b = brands.find((x) => x.slug === f.brandSlug);
        if (b) q = q.eq('brand_id', b.id);
      }
      if (f.q) q = q.ilike('name', `%${f.q}%`);
      if (f.minPrice) q = q.gte('price', f.minPrice);
      if (f.maxPrice) q = q.lte('price', f.maxPrice);
      if (f.inStock) q = q.gt('stock_qty', 0);
      if (f.featured) q = q.eq('is_featured', true);
      if (f.flash) q = q.eq('is_flash_deal', true);
      if (f.isNew) q = q.eq('is_new', true);
      switch (f.sort) {
        case 'price-asc': q = q.order('price', { ascending: true }); break;
        case 'price-desc': q = q.order('price', { ascending: false }); break;
        case 'rating': q = q.order('rating', { ascending: false }); break;
        case 'newest': q = q.order('created_at', { ascending: false }); break;
        default: q = q.order('reviews_count', { ascending: false });
      }
      q = q.range((page - 1) * perPage, page * perPage - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { items: (data ?? []) as Product[], total: count ?? 0 };
    },
  );
}

export async function getProduct(slug: string): Promise<Product | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return live(
    async () => {
      const p = seedProducts.find((x) => x.slug === slug && x.is_active);
      return p ? withJoins(p) : null;
    },
    async (sb) => {
      const { data, error } = await sb
        .from('products')
        .select('*, category:categories(*), brand:brands(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as Product) ?? null;
    },
  );
}

export async function getRelated(
  product: Product,
  limit = 8,
): Promise<Product[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  const { items } = await getProducts({
    categorySlug: product.category?.slug,
    perPage: limit + 1,
  });
  return items.filter((p) => p.id !== product.id).slice(0, limit);
}

// ---------- banners ----------
export async function getBanners(position?: Banner['position']): Promise<Banner[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('banners');
  return live(
    async () =>
      seedBanners
        .filter((b) => b.is_active && (!position || b.position === position))
        .sort((a, b) => a.sort_order - b.sort_order),
    async (sb) => {
      let q = sb
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (position) q = q.eq('position', position);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  );
}

// ---------- coupons ----------
export async function getCoupon(code: string): Promise<Coupon | null> {
  return live(
    async () => null,
    async (sb) => {
      const { data, error } = await sb
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as Coupon) ?? null;
    },
  );
}

// ---------- orders ----------
const demoOrders: Order[] = [];

export async function createOrder(input: {
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  area?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: Order['payment_method'];
  sender_number?: string;
  trx_id?: string;
  notes?: string;
}): Promise<Order> {
  const order: Order = {
    id: `demo-${Date.now()}`,
    order_no: `TS-${Date.now().toString().slice(-8)}`,
    payment_status: 'unpaid',
    status: 'pending',
    created_at: new Date().toISOString(),
    ...input,
  };
  // Use service_role client: anon key is blocked by RLS on orders.
  // This runs in a server-side API route, so service_role is safe.
  try {
    const { supabaseAdmin } = await import('./admin-db');
    const sb = supabaseAdmin();
    const baseRow = {
      order_no: order.order_no,
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      area: input.area,
      items: input.items,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      total: input.total,
      payment_method: input.payment_method,
      notes: input.notes,
    };
    let { data, error } = await sb
      .from('orders')
      .insert({ ...baseRow, sender_number: input.sender_number, trx_id: input.trx_id })
      .select()
      .single();
    if (error && (error.message.includes('sender_number') || error.message.includes('trx_id'))) {
      // Fallback: orders table may not have sender_number/trx_id columns yet
      const retry = await sb.from('orders').insert(baseRow).select().single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    return data as Order;
  } catch {
    // last-resort in-memory fallback (should not happen when DB is configured)
    demoOrders.unshift(order);
    return order;
  }
}

export async function getOrders(limit = 100): Promise<Order[]> {
  return live(
    async () => demoOrders.slice(0, limit),
    async (sb) => {
      const { data, error } = await sb
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  );
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  return live(
    async () => {
      const o = demoOrders.find((x) => x.id === id);
      if (o) o.status = status;
    },
    async (sb) => {
      const { error } = await sb.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
  );
}
