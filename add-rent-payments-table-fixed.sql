-- Create rent_payments table to track monthly rent payments
-- This table stores individual payment records for each property and month/year
-- This version includes DROP POLICY IF EXISTS to handle re-runs

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('paid', 'unpaid', 'partial')) DEFAULT 'unpaid',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, month, year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rent_payments_user_id ON rent_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_year_month ON rent_payments(year, month);

-- Enable Row Level Security
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view their own rent payments" ON rent_payments;
DROP POLICY IF EXISTS "Users can insert their own rent payments" ON rent_payments;
DROP POLICY IF EXISTS "Users can update their own rent payments" ON rent_payments;
DROP POLICY IF EXISTS "Users can delete their own rent payments" ON rent_payments;

-- Create RLS policies
-- Users can only access their own rent payments
CREATE POLICY "Users can view their own rent payments"
  ON rent_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rent payments"
  ON rent_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rent payments"
  ON rent_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rent payments"
  ON rent_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to document the table
COMMENT ON TABLE rent_payments IS 'Tracks monthly rent payments for properties';
COMMENT ON COLUMN rent_payments.month IS 'Month of payment (1-12)';
COMMENT ON COLUMN rent_payments.year IS 'Year of payment';
COMMENT ON COLUMN rent_payments.status IS 'Payment status: paid, unpaid, or partial';
COMMENT ON COLUMN rent_payments.amount IS 'Amount paid (may differ from monthly_rent for partial payments)';

