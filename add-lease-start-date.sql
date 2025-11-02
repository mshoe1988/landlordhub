-- Add lease_start_date column to properties table
-- This migration adds the lease_start_date column that was renamed from purchase_date

-- Add the column if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lease_start_date DATE;

-- Add a comment to document the column
COMMENT ON COLUMN properties.lease_start_date IS 'Date when the lease started for this property';
