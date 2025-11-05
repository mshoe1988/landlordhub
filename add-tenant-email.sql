-- Add tenant_email column to properties table
-- This migration adds a tenant_email field to store tenant email addresses

-- Add the tenant_email column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS tenant_email TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN properties.tenant_email IS 'Email address of the tenant for this property';

-- Create an index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_properties_tenant_email ON properties(tenant_email);

-- Update existing records to have NULL tenant_email (they will be populated when users edit properties)
-- No UPDATE statement needed as new column defaults to NULL











