-- Talukdar Shop — Supabase schema (PostgreSQL)
-- Run this in the Supabase SQL editor. The app works without it too
-- (falls back to built-in demo data), but all admin edits need this DB.

create extension if not exists "pgcrypto";

-- Categories
create table if not exists categories (
  id text primary key default ('c-' || substr(gen_random_uuid()::text, 1, 8)),
  name text not null,
  slug text not null unique,
  icon text,
  image text,
  parent_id text references categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  description text,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now()
);

-- Brands
create table if not exists brands (
  id text primary key default ('b-' || substr(gen_random_uuid()::text, 1, 8)),
  name text not null,
  slug text not null unique,
  logo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id text primary key default ('p-' || substr(gen_random_uuid()::text, 1, 8)),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  category_id text not null references categories(id) on delete restrict,
  brand_id text not null references brands(id) on delete restrict,
  price int not null check (price >= 0),
  old_price int,
  short_desc text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  stock_qty int not null default 0,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_flash_deal boolean not null default false,
  flash_price int,
  flash_ends_at timestamptz,
  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  emi_available boolean not null default false,
  meta_title text,
  meta_description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_brand_idx on products(brand_id);
create index if not exists products_slug_idx on products(slug);
create index if not exists products_featured_idx on products(is_featured) where is_active;

-- Banners / sliders
create table if not exists banners (
  id text primary key default ('bn-' || substr(gen_random_uuid()::text, 1, 8)),
  title text not null,
  subtitle text,
  image text not null,
  link text not null default '/',
  sort_order int not null default 0,
  is_active boolean not null default true,
  position text not null default 'hero' check (position in ('hero','side','promo','brand')),
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  area text,
  items jsonb not null,
  subtotal int not null,
  shipping int not null default 0,
  discount int not null default 0,
  total int not null,
  payment_method text not null default 'cod'
    check (payment_method in ('cod','bkash','nagad','rocket','card','emi')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid')),
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_status_idx on orders(status);

-- Coupons
create table if not exists coupons (
  id text primary key default ('cp-' || substr(gen_random_uuid()::text, 1, 8)),
  code text not null unique,
  type text not null default 'flat' check (type in ('percent','flat')),
  value int not null,
  min_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Site settings (key/value)
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Open read access for the storefront (anon key). Writes go through
-- server routes; tighten with RLS policies for production.
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table banners enable row level security;
alter table orders enable row level security;
alter table coupons enable row level security;
alter table settings enable row level security;

drop policy if exists "public read" on categories;
create policy "public read" on categories for select using (true);
drop policy if exists "public read" on brands;
create policy "public read" on brands for select using (true);
drop policy if exists "public read" on products;
create policy "public read" on products for select using (true);
drop policy if exists "public read" on banners;
create policy "public read" on banners for select using (true);
drop policy if exists "public read" on coupons;
create policy "public read" on coupons for select using (true);
drop policy if exists "public read" on settings;
create policy "public read" on settings for select using (true);
-- orders: allow insert (checkout) + select own via order_no match handled in app
drop policy if exists "checkout insert" on orders;
create policy "checkout insert" on orders for insert with check (true);
