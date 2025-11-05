# 💳 Stripe Setup Guide for LandlordHub

This guide will help you set up Stripe payments for your LandlordHub property management application.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete your business information
3. Verify your email address

### Step 2: Get Your API Keys
1. Log into your Stripe Dashboard
2. Go to **"Developers" → "API Keys"**
3. Copy these keys:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### Step 3: Set Up Products and Prices
1. **Set your secret key as an environment variable:**
   ```bash
   export STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

2. **Run the setup script:**
   ```bash
   node setup-stripe-products.js
   ```

3. **Add the output to your `.env.local` file:**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_STARTER_PRICE_ID=price_xxxxx
   STRIPE_PRO_PRICE_ID=price_xxxxx
   ```

### Step 4: Test Your Setup
1. Restart your development server: `npm run dev`
2. Go to your app and test the payment flow
3. Use Stripe's test card numbers for testing

## 🧪 Test Card Numbers

Use these test card numbers to test payments:

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Visa - Success |
| `4000000000000002` | Visa - Declined |
| `4000000000009995` | Visa - Insufficient funds |
| `5555555555554444` | Mastercard - Success |

**Expiry:** Any future date (e.g., 12/25)  
**CVC:** Any 3 digits (e.g., 123)

## 📋 Pricing Plans

Your LandlordHub app includes these subscription plans:

### 🆓 Free Plan
- **Price:** $0/month
- **Properties:** 1
- **Features:**
  - Basic expense tracking
  - Maintenance tasks
  - Document storage
  - Email support

### 🚀 Starter Plan
- **Price:** $19/month
- **Properties:** Up to 5
- **Features:**
  - Advanced reporting
  - CSV exports
  - Email reminders
  - Priority support

### 💼 Pro Plan
- **Price:** $39/month
- **Properties:** Unlimited
- **Features:**
  - Advanced analytics
  - Tax reporting
  - API access
  - White-label options
  - Dedicated support

## 🔧 Webhook Setup (Optional)

For production, you'll want to set up webhooks to handle payment events:

1. **Go to Stripe Dashboard → Developers → Webhooks**
2. **Add endpoint:** `https://yourdomain.com/api/webhooks/stripe`
3. **Select events:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🚀 Going Live

When you're ready to accept real payments:

1. **Complete Stripe account verification**
2. **Switch to live mode** in Stripe Dashboard
3. **Update environment variables** with live keys
4. **Test with small amounts first**

## 🆘 Troubleshooting

### Common Issues:

**"Stripe not configured" error:**
- Check that all environment variables are set correctly
- Restart your development server after adding new variables

**"Invalid API key" error:**
- Verify your API keys are correct
- Make sure you're using the right keys (test vs live)

**Payment not processing:**
- Check browser console for errors
- Verify webhook endpoints are accessible
- Test with Stripe's test card numbers

## 📞 Support

- **Stripe Documentation:** [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support:** Available in your Stripe Dashboard
- **LandlordHub Issues:** Check the application logs

---

**Need help?** The setup script will guide you through each step and provide the exact environment variables you need to add to your `.env.local` file.










