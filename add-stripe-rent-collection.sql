-- Table to store Stripe Connect account info for each landlord
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT UNIQUE NOT NULL,
  details_submitted BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Policies: landlords manage their own connect account row
CREATE POLICY "Users can view their own connect account"
  ON stripe_connect_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connect account"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connect account"
  ON stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table to track rent collection checkout sessions
CREATE TABLE IF NOT EXISTS rent_collection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  due_date DATE,
  description TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'expired', 'canceled', 'past_due')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_link_url TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  stripe_account_id TEXT,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on rent collection sessions
ALTER TABLE rent_collection_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rent collection sessions"
  ON rent_collection_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rent collection sessions"
  ON rent_collection_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rent collection sessions"
  ON rent_collection_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_collection_sessions_user_id ON rent_collection_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_collection_sessions_property_id ON rent_collection_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_collection_sessions_status ON rent_collection_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rent_collection_sessions_created_at ON rent_collection_sessions(created_at DESC);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rent_collection_sessions_updated_at
  BEFORE UPDATE ON rent_collection_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
