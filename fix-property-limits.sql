-- Fix property limits to match correct pricing tiers
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
      RETURN property_count < 1;  -- Free: 1 property
    WHEN 'starter' THEN
      RETURN property_count < 5;  -- Basic: 2-5 properties (max 5)
    WHEN 'growth' THEN
      RETURN property_count < 10; -- Growth: 5-10 properties (max 10)
    WHEN 'pro' THEN
      RETURN true;                -- Pro: Unlimited properties
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;






