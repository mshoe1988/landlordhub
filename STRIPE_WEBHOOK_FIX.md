# Stripe Webhook Fix Guide

## Problem
Payment went through in Stripe but account still shows "Free" plan. This means the webhook isn't properly updating the database.

## Immediate Fix (Manual Database Update)

### Option 1: Run the Fix Script
```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run the fix script
node fix-subscription.js
```

### Option 2: Manual Database Update
1. Go to your Supabase dashboard
2. Navigate to Table Editor → subscriptions
3. Find your user's subscription record
4. Update the `plan` field from 'free' to 'starter'
5. Update the `status` field to 'active'

## Permanent Fix (Webhook Configuration)

### Step 1: Check Stripe Webhook Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Find your webhook endpoint
4. Check if it's pointing to: `https://landlordhubapp.com/api/webhooks/stripe`

### Step 2: Verify Webhook Events
Your webhook should be listening for these events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Step 3: Test Webhook
1. In Stripe dashboard, go to your webhook
2. Click **"Send test webhook"**
3. Select `customer.subscription.created`
4. Check if it reaches your endpoint

### Step 4: Check Webhook Logs
1. In Stripe dashboard, go to your webhook
2. Click **"Recent deliveries"**
3. Look for any failed deliveries
4. Check the response codes and error messages

## Common Webhook Issues

### Issue 1: Webhook URL Wrong
- **Problem**: Webhook pointing to wrong URL
- **Solution**: Update webhook URL to `https://landlordhubapp.com/api/webhooks/stripe`

### Issue 2: Missing Events
- **Problem**: Webhook not listening for subscription events
- **Solution**: Add the required events listed above

### Issue 3: Authentication Issues
- **Problem**: Webhook secret not matching
- **Solution**: Check `STRIPE_WEBHOOK_SECRET` environment variable

### Issue 4: Database Permissions
- **Problem**: Webhook can't write to database
- **Solution**: Ensure service role key has proper permissions

## Testing the Fix

### Test 1: Check Account Page
1. Go to `https://landlordhubapp.com/account`
2. Should now show "Basic" plan instead of "Free"

### Test 2: Check Database
1. Go to Supabase dashboard
2. Check subscriptions table
3. Should see your user with plan='starter' and status='active'

### Test 3: Test New Subscription
1. Try upgrading another account
2. Should work properly now

## Prevention

### Monitor Webhook Health
1. Set up webhook monitoring in Stripe
2. Check webhook logs regularly
3. Set up alerts for failed webhooks

### Test Webhooks Regularly
1. Use Stripe CLI to test webhooks locally
2. Test webhook endpoints in staging environment
3. Verify webhook responses

## Stripe CLI Testing (Optional)

If you have Stripe CLI installed:
```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook
stripe trigger customer.subscription.created
```

## Environment Variables Check

Make sure these are set in Vercel:
- `STRIPE_WEBHOOK_SECRET` - Your webhook secret from Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Quick Commands

```bash
# Check environment variables
vercel env ls

# View recent logs
vercel logs [deployment-url]

# Test webhook endpoint
curl -X POST https://landlordhubapp.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```








