-- Add prorated rent support to rent_payments table
-- This adds fields to track partial month rent (move-in/move-out mid-month)

-- Add days_covered field to track how many days in the month the payment covers
ALTER TABLE rent_payments 
ADD COLUMN IF NOT EXISTS days_covered INTEGER;

-- Add move_in_date and move_out_date to track when tenant occupied the property for this payment
ALTER TABLE rent_payments 
ADD COLUMN IF NOT EXISTS move_in_date DATE;

ALTER TABLE rent_payments 
ADD COLUMN IF NOT EXISTS move_out_date DATE;

-- Add comments to document the columns
COMMENT ON COLUMN rent_payments.days_covered IS 'Number of days in the month covered by this payment (for prorated rent). NULL means full month.';
COMMENT ON COLUMN rent_payments.move_in_date IS 'Date tenant moved in (for prorated first month)';
COMMENT ON COLUMN rent_payments.move_out_date IS 'Date tenant moved out (for prorated last month)';

