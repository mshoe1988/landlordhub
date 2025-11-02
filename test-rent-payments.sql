-- Quick test query to verify rent_payments table exists and is accessible
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rent_payments';

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rent_payments'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'rent_payments';

-- 4. Check RLS policies
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rent_payments';

-- 5. Try to query the table (will show any RLS issues)
SELECT COUNT(*) as total_records FROM rent_payments;

-- 6. Test insert (replace YOUR_USER_ID and YOUR_PROPERTY_ID with actual values)
-- This will help verify RLS policies work
/*
INSERT INTO rent_payments (
  user_id, 
  property_id, 
  month, 
  year, 
  amount, 
  status
) VALUES (
  'YOUR_USER_ID'::uuid,
  'YOUR_PROPERTY_ID'::uuid,
  EXTRACT(MONTH FROM CURRENT_DATE)::int,
  EXTRACT(YEAR FROM CURRENT_DATE)::int,
  1000.00,
  'paid'
)
ON CONFLICT (property_id, month, year) DO NOTHING;
*/

