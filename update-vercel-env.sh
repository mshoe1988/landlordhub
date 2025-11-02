#!/bin/bash

# Update Vercel environment variables for the new Growth tier
echo "Adding new Stripe price IDs to Vercel..."

# Add Basic tier price ID
vercel env add STRIPE_BASIC_PRICE_ID production <<< "price_1SLTavJ5Jzy1zZc8glhf5ncI"

# Add Growth tier price ID  
vercel env add STRIPE_GROWTH_PRICE_ID production <<< "price_1SLTavJ5Jzy1zZc8mjo8DwFf"

# Update existing Pro tier price ID
vercel env add STRIPE_PRO_PRICE_ID production <<< "price_1SLTawJ5Jzy1zZc8guIyMe2W"

# Update Free tier price ID
vercel env add STRIPE_FREE_PRICE_ID production <<< "price_1SLTawJ5Jzy1zZc8JlycwdEs"

echo "Environment variables updated!"
echo "Redeploying to apply changes..."

# Redeploy to apply the new environment variables
vercel --prod --yes





