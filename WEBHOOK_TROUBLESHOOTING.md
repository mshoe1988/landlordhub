# Webhook Troubleshooting Guide

## Problem
Users upgrade their subscription but the webhook doesn't create/update the subscription record in the database, causing them to remain on the "Free" plan even after payment.

## Root Causes
1. **Webhook not configured** in Stripe Dashboard
2. **Webhook URL incorrect** or not accessible
3. **Webhook events not selected** properly
4. **Webhook secret mismatch**
5. **Database constraints** preventing record creation

## Immediate Fix (Already Implemented)
The checkout session now creates a **fallback subscription record** immediately when a user starts the upgrade process. This ensures users get their subscription even if the webhook fails.

## Permanent Fix (Webhook Configuration)

### Step 1: Check Stripe Webhook Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Find your webhook endpoint
4. Verify it's pointing to: `https://landlordhubapp.com/api/webhooks/stripe`

### Step 2: Verify Webhook Events
Your webhook should be listening for these events:
- `customer.subscription.created` ✅
- `customer.subscription.updated` ✅
- `customer.subscription.deleted` ✅
- `invoice.payment_succeeded` ✅
- `invoice.payment_failed` ✅

### Step 3: Test Webhook
1. In Stripe dashboard, go to your webhook
2. Click **"Send test webhook"**
3. Select `customer.subscription.created`
4. Check if it reaches your endpoint successfully

### Step 4: Check Webhook Logs
1. In Stripe dashboard, go to your webhook
2. Click **"Recent deliveries"**
3. Look for any failed deliveries (red status)
4. Check the response codes and error messages

### Step 5: Verify Environment Variables
Ensure these are set in Vercel:
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe webhook settings
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## How the Fix Works

### Before (Problematic)
1. User clicks upgrade → Checkout session created
2. User pays → Stripe processes payment
3. Stripe sends webhook → **Webhook fails** ❌
4. User remains on "Free" plan ❌

### After (Fixed)
1. User clicks upgrade → Checkout session created
2. **Fallback subscription record created immediately** ✅
3. User pays → Stripe processes payment
4. Stripe sends webhook → Updates subscription record ✅
5. User gets their paid plan ✅

## Monitoring

### Check Webhook Health
```bash
# Check recent webhook deliveries in Stripe Dashboard
# Look for:
# - Green checkmarks (success)
# - Red X's (failures)
# - Response codes (200 = success, 4xx/5xx = error)
```

### Check Database
```sql
-- Check for incomplete subscriptions that should be active
SELECT user_id, plan, status, stripe_customer_id, stripe_subscription_id, created_at
FROM subscriptions 
WHERE status = 'incomplete' 
AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Check Application Logs
```bash
# In Vercel dashboard, check function logs for:
# - "Handling subscription created"
# - "Subscription created successfully"
# - "Error creating subscription"
```

## Common Issues & Solutions

### Issue 1: Webhook URL Wrong
- **Problem**: Webhook pointing to wrong URL
- **Solution**: Update webhook URL to `https://landlordhubapp.com/api/webhooks/stripe`

### Issue 2: Missing Events
- **Problem**: Webhook not listening for subscription events
- **Solution**: Add the required events listed above

### Issue 3: Authentication Issues
- **Problem**: Webhook secret not matching
- **Solution**: Copy the webhook secret from Stripe and update `STRIPE_WEBHOOK_SECRET` in Vercel

### Issue 4: Database Constraints
- **Problem**: `stripe_customer_id` is NOT NULL but webhook doesn't provide it
- **Solution**: Fallback subscription record now provides this immediately

### Issue 5: Network Issues
- **Problem**: Stripe can't reach your webhook endpoint
- **Solution**: Check Vercel deployment status and ensure the endpoint is accessible

## Testing

### Test the Complete Flow
1. Create a test account
2. Try to upgrade to Basic plan
3. Complete payment in Stripe test mode
4. Check if account page shows "Basic" plan
5. Check webhook logs in Stripe dashboard

### Test Webhook Manually
```bash
# Use Stripe CLI to test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger customer.subscription.created
```

## Prevention

The fallback mechanism ensures this issue won't happen to future users because:
1. **Immediate record creation** - Subscription record is created before payment
2. **Webhook updates** - When webhook works, it updates the record
3. **No data loss** - Even if webhook fails, user still gets their plan
4. **Automatic recovery** - Webhook can update the record later when it works

## Status
✅ **FIXED** - Fallback mechanism implemented
🔄 **IN PROGRESS** - Webhook configuration verification needed








