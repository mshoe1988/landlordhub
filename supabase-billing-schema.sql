-- Create subscriptions table for Stripe billing
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  current_period_end timestamp WITH TIME ZONE,
  created_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(stripe_subscription_id)
);

-- Enable Row Level Security for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Create function to get user's current plan
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid uuid)
RETURNS text AS $$
DECLARE
  user_plan text;
BEGIN
  SELECT plan INTO user_plan
  FROM public.subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can add properties
CREATE OR REPLACE FUNCTION can_add_property(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_plan text;
  property_count integer;
BEGIN
  -- Get user's current plan
  SELECT get_user_plan(user_uuid) INTO user_plan;
  
  -- Get current property count
  SELECT COUNT(*) INTO property_count
  FROM public.properties
  WHERE user_id = user_uuid;
  
  -- Check limits based on plan
  CASE user_plan
    WHEN 'free' THEN
      RETURN property_count < 1;
    WHEN 'starter' THEN
      RETURN property_count < 5;
    WHEN 'pro' THEN
      RETURN true;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
