-- ============================================
-- FIX PAYMENT PROOF UPLOAD ISSUES
-- ============================================
-- Run this in Supabase SQL Editor to fix the issue where customers
-- cannot upload payment screenshots during checkout.

-- ============================================
-- PART 1: CREATE PAYMENT-PROOFS BUCKET
-- ============================================
-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,  -- MUST be public for customers to see their own upload preview
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif']
) ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif'];

-- ============================================
-- PART 2: SETUP STORAGE POLICIES
-- ============================================

-- 1. READ ACCESS (Public)
-- Customers need this to see the image they just uploaded
DROP POLICY IF EXISTS "Public read access for payment proofs" ON storage.objects;
CREATE POLICY "Public read access for payment proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- 2. UPLOAD ACCESS (Public/Unauthenticated)
-- Important: Checkout happens before user account creation mostly, or by guests
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- 3. UPDATE ACCESS (Public)
-- To allow replacing the image if they made a mistake
DROP POLICY IF EXISTS "Anyone can update payment proofs" ON storage.objects;
CREATE POLICY "Anyone can update payment proofs"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

-- 4. DELETE ACCESS (Public)
-- To allow removing the image
DROP POLICY IF EXISTS "Anyone can delete payment proofs" ON storage.objects;
CREATE POLICY "Anyone can delete payment proofs"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'payment-proofs');

-- ============================================
-- PART 3: VERIFICATION
-- ============================================
SELECT 
    '=== CHECKING BUCKET STATUS ===' as check_name,
    id, 
    name, 
    public,
    CASE 
        WHEN id = 'payment-proofs' AND public = true THEN '✅ SUCCESS: Bucket exists and is public'
        ELSE '❌ FAIL: Bucket issue'
    END as status
FROM storage.buckets 
WHERE id = 'payment-proofs';

SELECT 
    '=== CHECKING POLICIES ===' as check_name,
    policyname,
    cmd,
    '✅ Policy exists' as status
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%payment-proofs%'
ORDER BY cmd;
