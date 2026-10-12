-- Add manual payment verification columns to live orders table.
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS sender_number TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS trx_id TEXT;
