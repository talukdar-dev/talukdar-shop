-- Talukdar Shop WhatsApp AI agent — optional Phase-2 tables.
-- Phase 1 works WITHOUT these (sessions use settings table, catalog cached in memory).
-- Run once in Supabase Dashboard > SQL Editor when ready to scale.

create extension if not exists pg_trgm;

-- fuzzy product search (typo tolerant: "gijar" -> geyser)
create index if not exists products_name_trgm_idx
  on products using gin (name gin_trgm_ops);

create or replace function search_products_fuzzy(q text)
returns setof products as $$
  select * from products
  where is_active = true
    and (name % q or name ilike '%' || q || '%')
  order by similarity(name, q) desc
  limit 3;
$$ language sql stable;

-- durable queue (for Pro plan / external cron draining)
create table if not exists whatsapp_queue (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  message text not null,
  status text not null default 'pending',
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_queue_status_idx
  on whatsapp_queue (status, created_at);

-- conversation sessions (replaces settings-key sessions at scale)
create table if not exists whatsapp_sessions (
  phone text primary key,
  step text not null default 'idle',
  data jsonb not null default '{}',
  shown_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- groq usage log (distributed 90% rate-limit guard)
create table if not exists groq_usage (
  id bigint generated always as identity primary key,
  model text not null,
  tokens int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists groq_usage_time_idx on groq_usage (created_at);
