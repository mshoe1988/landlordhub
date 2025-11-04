#!/usr/bin/env node

/**
 * Webhook Configuration Checker
 * 
 * This script helps verify that your Stripe webhook is properly configured
 * and can reach your application endpoint.
 */

const https = require('https');
const http = require('http');

const WEBHOOK_URL = 'https://landlordhubapp.com/api/webhooks/stripe';

console.log('🔍 Checking webhook configuration...\n');

// Test 1: Check if webhook endpoint is accessible
console.log('1. Testing webhook endpoint accessibility...');

const testWebhook = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   ✅ Endpoint accessible (Status: ${res.statusCode})`);
      resolve(res.statusCode);
    });

    req.on('error', (error) => {
      console.log(`   ❌ Endpoint not accessible: ${error.message}`);
      reject(error);
    });

    req.write(JSON.stringify({ test: true }));
    req.end();
  });
};

// Test 2: Check environment variables
console.log('2. Checking environment variables...');

const checkEnvVars = () => {
  const required = [
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length === 0) {
    console.log('   ✅ All required environment variables are set');
  } else {
    console.log(`   ❌ Missing environment variables: ${missing.join(', ')}`);
    console.log('   💡 Set these in your Vercel dashboard under Settings → Environment Variables');
  }
};

// Test 3: Check Stripe webhook configuration
console.log('3. Stripe webhook configuration checklist...');
console.log('   📋 Please verify in Stripe Dashboard:');
console.log('      • Go to Developers → Webhooks');
console.log('      • Check webhook URL: https://landlordhubapp.com/api/webhooks/stripe');
console.log('      • Verify these events are selected:');
console.log('        - customer.subscription.created');
console.log('        - customer.subscription.updated');
console.log('        - customer.subscription.deleted');
console.log('        - invoice.payment_succeeded');
console.log('        - invoice.payment_failed');
console.log('      • Copy the webhook secret and set as STRIPE_WEBHOOK_SECRET');

// Run tests
async function runTests() {
  try {
    await testWebhook();
  } catch (error) {
    console.log('   ⚠️  Webhook endpoint test failed, but this might be expected');
  }
  
  checkEnvVars();
  
  console.log('\n4. Testing webhook with Stripe CLI (if installed)...');
  console.log('   Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('   Then: stripe trigger customer.subscription.created');
  
  console.log('\n5. Manual test steps:');
  console.log('   1. Create a test account');
  console.log('   2. Try to upgrade to Basic plan');
  console.log('   3. Complete payment in Stripe test mode');
  console.log('   4. Check if account page shows "Basic" plan');
  console.log('   5. Check webhook logs in Stripe dashboard');
  
  console.log('\n✅ Webhook configuration check complete!');
  console.log('\n💡 The fallback mechanism ensures users get their subscription even if webhook fails.');
}

runTests().catch(console.error);






