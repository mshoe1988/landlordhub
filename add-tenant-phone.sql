-- Add tenant_phone column to properties table
-- This migration adds a tenant_phone field to store tenant phone numbers

-- Add the tenant_phone column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS tenant_phone TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN properties.tenant_phone IS 'Phone number of the tenant for this property';

-- Create an index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_properties_tenant_phone ON properties(tenant_phone);

-- Update existing records to have NULL tenant_phone (they will be populated when users edit properties)
-- No UPDATE statement needed as new column defaults to NULL










