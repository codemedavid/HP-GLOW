-- Migration: Create vouchers and faqs tables
-- Run this in your Supabase SQL Editor

-- Create vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    max_discount NUMERIC(10,2) DEFAULT NULL, -- Max discount cap for percentage vouchers
    min_purchase_amount NUMERIC(10,2) DEFAULT 0,
    max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
    times_used INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL means no expiry
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers(active);
CREATE INDEX IF NOT EXISTS idx_faqs_active_sort ON public.faqs(active, sort_order);

-- Disable RLS for admin access (consistent with other tables in this project)
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.vouchers TO anon, authenticated;
GRANT ALL ON public.faqs TO anon, authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON public.vouchers;
CREATE TRIGGER update_vouchers_updated_at
    BEFORE UPDATE ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.faqs;
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Insert some sample FAQs (optional - you can delete these)
INSERT INTO public.faqs (question, answer, sort_order, active) VALUES
('How do I place an order?', 'Browse our products, add items to your cart, then proceed to checkout. Fill in your shipping details, select a payment method, and follow the instructions to complete your order.', 1, true),
('What payment methods do you accept?', 'We accept GCash, Maya, and bank transfers (BDO, BPI). Payment details are shown during checkout. Please send your payment screenshot via Instagram or Viber to confirm your order.', 2, true),
('How long does shipping take?', 'Orders paid before 1 PM are shipped the same day. NCR deliveries typically take 1-2 days, Luzon 2-3 days, and Visayas/Mindanao 3-5 days.', 3, true),
('Are your products lab-tested?', 'Yes! All our peptides come with Certificate of Analysis (COA) from third-party laboratories. You can view the lab reports on our COA page.', 4, true),
('How should I store the products?', 'Peptides should be stored at -20°C (freezer) for long-term storage. Once reconstituted, keep refrigerated at 2-8°C and use within 4-6 weeks.', 5, true),
('Do you offer refunds or returns?', 'Due to the nature of our products, we cannot accept returns. However, if you receive a damaged or incorrect item, please contact us within 24 hours with photos for a resolution.', 6, true),
('How do I apply a voucher code?', 'During checkout, you''ll see a voucher code input field. Enter your code and click "Apply" to see your discount reflected in the order total.', 7, true),
('Can I track my order?', 'Yes! After your order is shipped, we''ll send you a tracking number via Viber (typically after 11 PM). You can use this to track your package.', 8, true);
