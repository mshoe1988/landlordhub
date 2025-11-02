import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { plan } = await request.json()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the correct price ID based on the plan
    let priceId: string
    if (plan === 'basic') {
      priceId = process.env.STRIPE_BASIC_PRICE_ID || ''
    } else if (plan === 'growth') {
      priceId = process.env.STRIPE_GROWTH_PRICE_ID || ''
    } else if (plan === 'pro') {
      priceId = process.env.STRIPE_PRO_PRICE_ID || ''
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 })
    }

    // Check if user already has an active PAID subscription (not free)
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('plan', 'free')
      .maybeSingle()

    // If user has an active paid subscription, redirect to Customer Portal to upgrade/downgrade
    if (existingSubscription) {
      // For existing subscribers, we should redirect to Stripe Customer Portal
      // instead of creating a new checkout session
      return NextResponse.json({ 
        error: 'Please use the Customer Portal to manage your subscription.',
        redirectToPortal: true,
        customerPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/create-portal-session`
      }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId: string
    
    // Check if user already has a customer ID from a previous subscription
    const { data: existingCustomer } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .single()
    
    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      automatic_tax: { enabled: true },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `https://landlordhubapp.com/account?success=true`,
      cancel_url: `https://landlordhubapp.com/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan,
      },
    })

    // FALLBACK: Create a pending subscription record immediately
    // This ensures the user gets their subscription even if the webhook fails
    const planMapping: { [key: string]: string } = {
      'basic': 'starter',
      'growth': 'growth', 
      'pro': 'pro'
    }
    
    const dbPlan = planMapping[plan] || 'free'
    
    // Create a pending subscription record that will be updated by the webhook
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: null, // Will be updated by webhook
        plan: dbPlan,
        status: 'incomplete', // Will be updated by webhook
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })

    if (subscriptionError) {
      console.error('Error creating fallback subscription:', subscriptionError)
      // Don't fail the checkout session creation, just log the error
    } else {
      console.log('Created fallback subscription record for user:', user.id)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
