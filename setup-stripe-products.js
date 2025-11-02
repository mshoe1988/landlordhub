#!/usr/bin/env node

/**
 * Stripe Products and Prices Setup Script
 * Run this script to create products and prices in your Stripe account
 * 
 * Usage: node setup-stripe-products.js
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
    console.log('🚀 Setting up Stripe products and prices for LandlordHub...\n')

    // Create Starter Plan Product (Recurring)
    console.log('📦 Creating Starter Plan product (Monthly Recurring)...')
    const starterProduct = await stripe.products.create({
      name: 'LandlordHub Starter',
      description: 'Perfect for small property owners with up to 5 properties',
      metadata: {
        plan: 'starter',
        properties: '5',
        type: 'recurring'
      }
    })

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 1900, // $19.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan: 'starter',
        type: 'recurring'
      }
    })

    console.log(`✅ Starter Plan created:`)
    console.log(`   Product ID: ${starterProduct.id}`)
    console.log(`   Price ID: ${starterPrice.id}`)

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
    console.log(`STRIPE_STARTER_PRICE_ID=${starterPrice.id}`)
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
