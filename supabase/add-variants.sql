-- Add variant support + product_type to live products table.
-- Run this in Supabase SQL editor if the columns don't exist yet.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'physical'
CHECK (product_type IN ('physical', 'digital'));

ALTER TABLE products
ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
