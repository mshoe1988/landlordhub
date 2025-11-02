-- Add security_deposit column to properties table
-- This column stores the security deposit amount for each property

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10,2);

-- Add a comment to document the column
COMMENT ON COLUMN properties.security_deposit IS 'Security deposit amount collected from tenant';

-- Update existing properties to have NULL security_deposit (they will be populated when users edit properties)
-- No UPDATE statement needed as new column defaults to NULL

