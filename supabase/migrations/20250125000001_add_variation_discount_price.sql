-- Add discount_price column to product_variations table
-- This allows setting discounted prices per variation

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variations' 
    AND column_name = 'discount_price'
  ) THEN
    ALTER TABLE product_variations ADD COLUMN discount_price DECIMAL(10,2) DEFAULT NULL;
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_variations' 
ORDER BY ordinal_position;
