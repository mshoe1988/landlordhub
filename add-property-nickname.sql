-- Add nickname column to properties table
-- This column stores an optional friendly name/nickname for the property

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN properties.nickname IS 'Optional friendly name or nickname for the property (e.g., "Smith House", "Main St Property")';

