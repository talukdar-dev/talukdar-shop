-- Add product_type to products table (physical/digital)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'physical'
CHECK (product_type IN ('physical', 'digital'));
