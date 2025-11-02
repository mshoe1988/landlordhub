# Troubleshooting Rent Payments Feature

## Issue: Rent payment status not showing up on properties page

### Step 1: Verify SQL Migration Ran Successfully

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run this query to check if the table exists:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'rent_payments';
   ```
   If this returns no rows, the table wasn't created.

4. If the table doesn't exist, re-run the SQL migration:
   - Go to **SQL Editor** in Supabase
   - Paste the contents of `add-rent-payments-table.sql`
   - Click **Run**

### Step 2: Verify RLS Policies Exist

Run this query to check if RLS policies were created:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'rent_payments';
```

You should see 4 policies:
- Users can view their own rent payments
- Users can insert their own rent payments
- Users can update their own rent payments
- Users can delete their own rent payments

If policies are missing, re-run the SQL migration.

### Step 3: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Navigate to the Properties page
4. Look for errors or console.log messages:
   - Should see: "Rent payments loaded: {...}"
   - If you see "rent_payments table does not exist yet", the table wasn't created
   - If you see other errors, note the error message

### Step 4: Verify Component Conditions

The rent payment status component ONLY shows if:
1. Property has a `tenant_name` set
2. The component is loaded successfully

To test:
1. Edit a property and add a tenant name
2. Save the property
3. Check if the payment status appears below the property details

### Step 5: Test Database Access

Run this query in Supabase SQL Editor (replace `YOUR_USER_ID` with an actual user ID):
```sql
SELECT * FROM rent_payments 
WHERE user_id = 'YOUR_USER_ID' 
LIMIT 5;
```

If this fails with "relation does not exist", the table wasn't created.

### Step 6: Verify Build/Deployment

If you're on a production site (landlordhubapp.com):
1. Make sure the latest code is deployed
2. Check that the build completed successfully
3. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Step 7: Manual Table Creation

If the migration didn't work, try creating the table step by step:

```sql
-- Step 1: Create table
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

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_rent_payments_user_id ON rent_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_year_month ON rent_payments(year, month);

-- Step 3: Enable RLS
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
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
```

### Common Issues:

1. **Table doesn't exist**: Re-run SQL migration
2. **RLS policies blocking access**: Re-create policies
3. **Property has no tenant**: Add tenant name to property
4. **Build not deployed**: Redeploy application
5. **Cached old code**: Clear browser cache and hard refresh

