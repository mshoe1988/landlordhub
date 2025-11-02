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

    // Get user's subscription to find customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subError) {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ error: `Database error: ${subError.message}` }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found. You must have an active subscription to use the Customer Portal.' }, { status: 404 })
    }

    let customerId = subscription.stripe_customer_id

    // If no customer ID but we have a subscription ID, try to get customer from subscription
    if (!customerId && subscription.stripe_subscription_id) {
      console.log('No customer ID found, fetching from subscription:', subscription.stripe_subscription_id)
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
        customerId = stripeSubscription.customer as string
        console.log('Found customer ID from subscription:', customerId)
        
        // Update the database with the correct customer ID
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id)
      } catch (subError: any) {
        console.error('Error fetching subscription from Stripe:', subError)
        return NextResponse.json({
          error: `Could not find customer. Subscription may not exist in Stripe. Error: ${subError.message}`
        }, { status: 404 })
      }
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer ID found. Your subscription may not be fully set up. Please contact support.' 
      }, { status: 404 })
    }

    // Verify customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(customerId)
      console.log('Customer verified in Stripe:', customer.id)
    } catch (customerError: any) {
      console.error('Customer does not exist in Stripe:', customerError)
      return NextResponse.json({
        error: `Customer ${customerId} does not exist in Stripe. This usually happens when a subscription was created manually or the customer was deleted. Please recreate your subscription through the pricing page.`,
        customerId,
        suggestion: 'Try upgrading through the pricing page to create a new subscription with a valid customer.'
      }, { status: 404 })
    }

    // Create portal session
    console.log('Creating portal session for customer:', customerId)
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        // Explicit live domain for reliable return
        return_url: `https://landlordhubapp.com/account`,
      })

      console.log('Portal session created successfully:', session.url)
      return NextResponse.json({ url: session.url })
    } catch (stripeError: any) {
      console.error('Stripe portal session error:', {
        message: stripeError?.message,
        type: stripeError?.type,
        code: stripeError?.code,
        statusCode: stripeError?.statusCode,
        fullError: stripeError
      })
      // Return detailed error information for debugging
      const errorMessage = stripeError?.message || 'Unknown Stripe error'
      const errorDetails = {
        error: `Stripe error: ${errorMessage}`,
        stripeType: stripeError?.type || null,
        stripeCode: stripeError?.code || null,
        stripeStatusCode: stripeError?.statusCode || null,
        suggestion: 'Ensure Customer Portal is enabled in Stripe Dashboard (Settings → Billing → Customer portal). Also verify the customer exists in Stripe and you are using the correct mode (live vs test).'
      }
      return NextResponse.json(errorDetails, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
