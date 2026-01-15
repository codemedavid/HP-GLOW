-- Add free_shipping column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- Comment on column
COMMENT ON COLUMN products.free_shipping IS 'If true, orders containing this product will ship for free.';
