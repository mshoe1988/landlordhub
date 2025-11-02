-- Add rent_due_date column to properties table
-- This column stores the day of the month when rent is due (1-31)

ALTER TABLE properties 
ADD COLUMN rent_due_date INTEGER CHECK (rent_due_date >= 1 AND rent_due_date <= 31);

-- Add a comment to document the column
COMMENT ON COLUMN properties.rent_due_date IS 'Day of the month when rent is due (1-31)';

-- Update existing properties to have a default rent due date of 1st of the month
UPDATE properties 
SET rent_due_date = 1 
WHERE rent_due_date IS NULL;

