#!/usr/bin/env node

/**
 * Stripe Products and Prices Setup Script - Updated with Growth Tier
 * Run this script to create products and prices in your Stripe account
 * 
 * Usage: node setup-stripe-products-new.js
 * 
 * Make sure to set your STRIPE_SECRET_KEY environment variable first
 */

const Stripe = require('stripe')

// Check if Stripe secret key is provided
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required')
  console.log('Please set your Stripe secret key:')
  console.log('export STRIPE_SECRET_KEY=sk_test_your_secret_key_here')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function createProductsAndPrices() {
  try {
    console.log('🚀 Setting up Stripe products and prices for LandlordHub with Growth tier...\n')

    // Create Basic Plan Product (Recurring)
    console.log('📦 Creating Basic Plan product (Monthly Recurring)...')
    const basicProduct = await stripe.products.create({
      name: 'LandlordHub Basic',
      description: 'Perfect for small property owners with 2-5 properties',
      metadata: {
        plan: 'basic',
        properties: '2-5',
        type: 'recurring'
      }
    })

    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 1900, // $19.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'basic',
        type: 'recurring'
      }
    })

    console.log(`✅ Basic Plan created:`)
    console.log(`   Product ID: ${basicProduct.id}`)
    console.log(`   Price ID: ${basicPrice.id}`)

    // Create Growth Plan Product (Recurring)
    console.log('\n📦 Creating Growth Plan product (Monthly Recurring)...')
    const growthProduct = await stripe.products.create({
      name: 'LandlordHub Growth',
      description: 'Ideal for growing property portfolios with 6-10 properties',
      metadata: {
        plan: 'growth',
        properties: '6-10',
        type: 'recurring'
      }
    })

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 2900, // $29.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'growth',
        type: 'recurring'
      }
    })

    console.log(`✅ Growth Plan created:`)
    console.log(`   Product ID: ${growthProduct.id}`)
    console.log(`   Price ID: ${growthPrice.id}`)

    // Create Pro Plan Product (Recurring)
    console.log('\n📦 Creating Pro Plan product (Monthly Recurring)...')
    const proProduct = await stripe.products.create({
      name: 'LandlordHub Pro',
      description: 'Unlimited properties with advanced features for serious property managers',
      metadata: {
        plan: 'pro',
        properties: 'unlimited',
        type: 'recurring'
      }
    })

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 3900, // $39.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'pro',
        type: 'recurring'
      }
    })

    console.log(`✅ Pro Plan created:`)
    console.log(`   Product ID: ${proProduct.id}`)
    console.log(`   Price ID: ${proPrice.id}`)

    // Create Free Plan Product (Free tier)
    console.log('\n📦 Creating Free Plan product (Free tier)...')
    const freeProduct = await stripe.products.create({
      name: 'LandlordHub Free',
      description: 'Free plan with 1 property included - perfect for getting started',
      metadata: {
        plan: 'free',
        properties: '1',
        type: 'free'
      }
    })

    const freePrice = await stripe.prices.create({
      product: freeProduct.id,
      unit_amount: 0, // $0.00 - Free
      currency: 'usd',
      metadata: {
        plan: 'free',
        type: 'free'
      }
    })

    console.log(`✅ Free Plan created:`)
    console.log(`   Product ID: ${freeProduct.id}`)
    console.log(`   Price ID: ${freePrice.id}`)

    // Output environment variables to add to .env.local
    console.log('\n🔧 Add these environment variables to your .env.local file:')
    console.log('=' * 80)
    console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here`)
    console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}`)
    console.log(`# Subscription Plans`)
    console.log(`STRIPE_FREE_PRICE_ID=${freePrice.id}`)
    console.log(`STRIPE_BASIC_PRICE_ID=${basicPrice.id}`)
    console.log(`STRIPE_GROWTH_PRICE_ID=${growthPrice.id}`)
    console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`)
    console.log('=' * 80)

    console.log('\n🎉 Stripe products and prices setup complete!')
    console.log('\nNext steps:')
    console.log('1. Add the environment variables above to your .env.local file')
    console.log('2. Get your publishable key from Stripe Dashboard → Developers → API Keys')
    console.log('3. Restart your development server')
    console.log('4. Test the payment flow in your application')

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message)
    process.exit(1)
  }
}

// Run the setup
createProductsAndPrices()









