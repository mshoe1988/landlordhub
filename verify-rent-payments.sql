-- Verify rent_payments table was created successfully
-- Run this in Supabase SQL Editor to confirm everything is set up

-- 1. Check if table exists
SELECT 
  'Table exists' as check_type,
  table_name,
  '✓' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rent_payments';

-- 2. Check table columns
SELECT 
  'Column check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rent_payments'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
  'RLS enabled' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✓' ELSE '✗' END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'rent_payments';

-- 4. Check RLS policies (should see 4 policies)
SELECT 
  'Policy check' as check_type,
  policyname,
  cmd as operation,
  CASE WHEN qual IS NOT NULL THEN '✓' ELSE '✗' END as has_rule
FROM pg_policies 
WHERE tablename = 'rent_payments';

-- 5. Check indexes
SELECT 
  'Index check' as check_type,
  indexname,
  '✓' as status
FROM pg_indexes
WHERE tablename = 'rent_payments';

-- If all checks show ✓, the table is set up correctly!

