// Talukdar Shop — shared types

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  product_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  is_active: boolean;
}

export interface ProductVariantOption {
  id: string;
  label: string;
  price_delta: number;
  sku_suffix?: string;
  stock_qty?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  brand_id: string;
  price: number;
  old_price?: number | null;
  short_desc?: string;
  description?: string; // HTML
  specs?: Record<string, string | string[]>;
  images: string[];
  stock_qty: number;
  product_type?: 'physical' | 'digital';
  variants?: ProductVariant[];
  is_featured: boolean;
  is_new: boolean;
  is_flash_deal: boolean;
  flash_price?: number | null;
  flash_ends_at?: string | null;
  rating: number;
  reviews_count: number;
  emi_available: boolean;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  created_at?: string;
  // joined
  category?: Category;
  brand?: Brand;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  sort_order: number;
  is_active: boolean;
  position: 'hero' | 'side' | 'promo' | 'brand';
}

export interface CartItem {
  product_id: string;
  qty: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  order_no: string;
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
  payment_method: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card' | 'emi';
  payment_status: 'unpaid' | 'paid';
  sender_number?: string;
  trx_id?: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  logo?: string;
  hotline: string;
  hotline_hours: string;
  email: string;
  address: string;
  announcement: string;
  announcement_link?: string;
  facebook?: string;
  youtube?: string;
  currency: string;
  free_shipping_over?: number;
  inside_dhaka_shipping: number;
  outside_dhaka_shipping: number;
  // payment methods
  payment_cod_enabled?: boolean;
  payment_bkash_enabled?: boolean;
  payment_bkash_number?: string;
  payment_nagad_enabled?: boolean;
  payment_nagad_number?: string;
  payment_rocket_enabled?: boolean;
  payment_rocket_number?: string;
  // merchant (online) payment - for future use
  payment_merchant_enabled?: boolean;
  payment_merchant_provider?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  is_active: boolean;
}
