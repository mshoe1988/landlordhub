-- Add 'growth' plan to the subscriptions table constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check 
  CHECK (plan IN ('free', 'starter', 'growth', 'pro'));

-- Update the can_add_property function to handle growth plan
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
    WHEN 'growth' THEN
      RETURN property_count < 15;
    WHEN 'pro' THEN
      RETURN true;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;








