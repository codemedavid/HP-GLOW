-- Fix ALL products with discount pricing issues
-- The base_price should be the ORIGINAL price (before discount)
-- The discount_price should be the SALE price (after discount)
-- Issue: Some products have base_price = discount_price, so original crossed-out price shows wrong

-- OPTION 1: Run this query first to SEE which products have this issue:
-- SELECT name, base_price, discount_price, discount_active,
--        (base_price - COALESCE(discount_price, base_price)) as current_savings
-- FROM products 
-- WHERE discount_active = true 
--   AND discount_price IS NOT NULL
--   AND base_price = discount_price;

-- OPTION 2: Fix specific products manually with correct pricing
-- For Glutathione: Original ₱1,499, Sale ₱999 (Save ₱500)
UPDATE products 
SET 
  base_price = 1499.00,
  discount_price = 999.00,
  discount_active = true
WHERE LOWER(name) = 'glutathione' OR LOWER(name) LIKE '%glutathione%';

-- Add more product fixes below if needed:
-- Example: For another product with ₱500 discount
-- UPDATE products SET base_price = XXXX.00, discount_price = YYYY.00, discount_active = true WHERE LOWER(name) = 'product_name';

-- Verify all discounted products now have correct pricing
SELECT 
  name, 
  base_price as original_price, 
  discount_price as sale_price, 
  (base_price - COALESCE(discount_price, base_price)) as savings,
  discount_active
FROM products 
WHERE discount_active = true 
ORDER BY name;
