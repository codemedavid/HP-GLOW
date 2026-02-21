-- Add voucher tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_discount NUMERIC DEFAULT 0;

-- Ensure shipping_barangay column exists (Checkout.tsx already writes to it)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_barangay TEXT DEFAULT NULL;
