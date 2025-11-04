-- Database migration to add rent_due_date column to properties table
-- Run this in your Supabase SQL editor

-- Check if the column already exists before adding it
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'rent_due_date'
    ) THEN
        ALTER TABLE properties 
        ADD COLUMN rent_due_date INTEGER CHECK (rent_due_date >= 1 AND rent_due_date <= 31);
        
        -- Add a comment to document the column
        COMMENT ON COLUMN properties.rent_due_date IS 'Day of the month when rent is due (1-31)';
        
        -- Update existing properties to have a default rent due date of 1st of the month
        UPDATE properties 
        SET rent_due_date = 1 
        WHERE rent_due_date IS NULL;
        
        RAISE NOTICE 'rent_due_date column added successfully';
    ELSE
        RAISE NOTICE 'rent_due_date column already exists';
    END IF;
END $$;








