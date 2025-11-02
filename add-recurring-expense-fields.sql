-- Add recurring expense fields to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly'));

-- Add index for better performance on recurring queries
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring, recurring_frequency);

