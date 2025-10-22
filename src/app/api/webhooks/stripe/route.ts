import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  
  // Get plan from price
  const priceId = subscription.items.data[0].price.id
  const plan = getPlanFromPriceId(priceId)

  // Get user from customer metadata
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata.user_id

  if (!userId) {
    console.error('No user_id found in customer metadata')
    return
  }

  // Upsert subscription
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      status,
      current_period_end: currentPeriodEnd.toISOString(),
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  await supabase
    .from('subscriptions')
    .update({
      status,
      current_period_end: currentPeriodEnd.toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscriptionId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
      })
      .eq('stripe_subscription_id', subscriptionId)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', subscriptionId)
  }
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
    return 'starter'
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro'
  }
  return 'free'
}
