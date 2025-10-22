# Stripe Billing Setup Guide

## 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new account or sign in
3. Complete account verification
4. Switch to "Live mode" when ready for production

## 2. Create Products and Prices

### Create Starter Plan ($19/month)
1. Go to Products → Create Product
2. Name: "LandlordHub Starter"
3. Description: "Up to 5 properties with advanced features"
4. Pricing: $19.00 USD, Recurring monthly
5. Save the Price ID (starts with `price_`)

### Create Pro Plan ($39/month)
1. Go to Products → Create Product
2. Name: "LandlordHub Pro"
3. Description: "Unlimited properties with premium features"
4. Pricing: $39.00 USD, Recurring monthly
5. Save the Price ID (starts with `price_`)

## 3. Get API Keys

1. Go to Developers → API Keys
2. Copy the following:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

## 4. Set Up Webhooks

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret (starts with `whsec_`)

## 5. Configure Environment Variables

Update your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

## 6. Database Setup

Run the billing schema in your Supabase project:

```sql
-- Run the contents of supabase-billing-schema.sql
```

## 7. Test the Integration

### Test Checkout Flow
1. Start your development server
2. Go to `/pricing` page
3. Click "Upgrade to Starter" or "Upgrade to Pro"
4. Complete the test payment with Stripe test card: `4242 4242 4242 4242`
5. Verify the subscription is created in your database

### Test Webhooks (Local Development)
1. Install Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Use the webhook secret from the CLI output
3. Test webhook events with: `stripe trigger customer.subscription.created`

## 8. Production Deployment

### Vercel Configuration
1. Add all environment variables to Vercel dashboard
2. Update webhook URL to production domain
3. Test with real payment methods

### Stripe Dashboard Settings
1. Update webhook endpoint to production URL
2. Configure customer portal settings
3. Set up tax settings if needed
4. Configure email receipts

## 9. Customer Portal Setup

1. Go to Settings → Billing → Customer Portal
2. Enable the customer portal
3. Configure allowed actions:
   - Update payment methods
   - Download invoices
   - Cancel subscriptions
   - Update billing information

## 10. Testing Checklist

- [ ] Free plan allows 1 property
- [ ] Starter plan allows 5 properties
- [ ] Pro plan allows unlimited properties
- [ ] Property limit modal shows when limit reached
- [ ] Checkout flow works for both plans
- [ ] Webhooks update subscription status
- [ ] Customer portal works for billing management
- [ ] Account page shows current plan
- [ ] Upgrade/downgrade flows work
- [ ] Cancellation works properly

## 11. Security Considerations

- Never expose secret keys in client-side code
- Validate webhook signatures
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity
- Keep API keys secure

## 12. Monitoring and Analytics

- Set up Stripe Dashboard alerts
- Monitor failed payments
- Track subscription metrics
- Set up error logging
- Monitor webhook delivery

## 13. Common Issues

### Webhook Not Receiving Events
- Check webhook URL is correct
- Verify webhook secret matches
- Check server logs for errors
- Test with Stripe CLI

### Checkout Session Creation Fails
- Verify API keys are correct
- Check price IDs exist
- Ensure customer creation works
- Validate request payload

### Subscription Not Updating
- Check webhook endpoint is working
- Verify database connection
- Check RLS policies
- Monitor webhook delivery logs

## 14. Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
