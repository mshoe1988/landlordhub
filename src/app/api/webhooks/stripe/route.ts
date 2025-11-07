import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { trackSubscriptionUpgrade, trackFreeToPaidUpgrade } from '@/lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, event.account)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
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
      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice)
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
  console.log('Handling subscription created:', subscription.id)
  
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date()
  
  // Get plan from price
  const priceId = subscription.items.data[0].price.id
  const plan = getPlanFromPriceId(priceId)
  console.log('Plan determined:', plan, 'from price ID:', priceId)

  // Get user from customer metadata
  const customer = await stripe!.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata.user_id
  console.log('Customer metadata:', (customer as Stripe.Customer).metadata)

  if (!userId) {
    console.error('No user_id found in customer metadata')
    return
  }

  console.log('Creating subscription for user:', userId)

  // Check if user had a previous subscription to determine if this is a free-to-paid upgrade
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single()

  const wasFreeUser = !existingSubscription || existingSubscription.plan === 'free'

  // Upsert subscription (conflict on user_id so we update the fallback row)
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      status,
      current_period_end: currentPeriodEnd.toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error creating subscription:', error)
  } else {
    console.log('Subscription created successfully')
    
    // Track conversion for analytics
    const planValue = getPlanValue(plan)
    const planName = getPlanDisplayName(plan)
    
    if (wasFreeUser) {
      // Track as free-to-paid upgrade
      console.log('Tracking free-to-paid upgrade for user:', userId)
      trackFreeToPaidUpgrade(planName, planValue, plan)
    } else {
      // Track as regular subscription upgrade
      console.log('Tracking subscription upgrade for user:', userId)
      trackSubscriptionUpgrade(planName, planValue, plan)
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription updated:', subscription.id)
  
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date()
  
  // Get plan from price
  const priceId = subscription.items.data[0].price.id
  const plan = getPlanFromPriceId(priceId)
  console.log('Plan determined:', plan, 'from price ID:', priceId)

  // Primary update by subscription ID
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status,
      current_period_end: currentPeriodEnd.toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription by subscription_id:', error)
  } else {
    console.log('Subscription updated successfully by subscription_id')
  }

  // Fallback: If no row had subscription_id yet (e.g., only fallback row exists), update by customer -> user_id
  try {
    const customerId = subscription.customer as string
    const customer = await stripe!.customers.retrieve(customerId)
    const userId = (customer as Stripe.Customer).metadata.user_id
    if (userId) {
      const { error: fallbackErr } = await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscriptionId,
          plan,
          status,
          current_period_end: currentPeriodEnd.toISOString(),
        })
        .eq('user_id', userId)

      if (fallbackErr) {
        console.error('Fallback update by user_id failed:', fallbackErr)
      } else {
        console.log('Fallback update by user_id succeeded')
      }
    }
  } catch (e) {
    console.error('Error during fallback update path:', e)
  }
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
  const subscriptionId = (invoice as any).subscription as string
  
  if (subscriptionId && stripe) {
    try {
      // Fetch the subscription to get current_period_end
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
      const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date()
      
      // Update subscription status and billing date
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
      
      console.log('Payment succeeded - subscription updated:', subscriptionId)
    } catch (error) {
      console.error('Error updating subscription on payment success:', error)
      // Fallback: just update status if subscription fetch fails
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
        })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  await syncRentCollectionFromInvoice(invoice, 'paid')
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', subscriptionId)
  }

  await syncRentCollectionFromInvoice(invoice, 'past_due')
}

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return 'starter'  // Map 'basic' plan to 'starter' in database
  } else if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) {
    return 'growth'  // Map 'growth' plan to 'growth' in database
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro'
  }
  return 'free'
}

function getPlanValue(plan: string): number {
  switch (plan) {
    case 'starter':
      return 19.00
    case 'growth':
      return 29.00
    case 'pro':
      return 39.00
    default:
      return 0
  }
}

function getPlanDisplayName(plan: string): string {
  switch (plan) {
    case 'starter':
      return 'LandlordHub Basic'
    case 'growth':
      return 'LandlordHub Growth'
    case 'pro':
      return 'LandlordHub Pro'
    default:
      return 'Free'
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, accountId?: string | null) {
  const rentSessionId = session.metadata?.rent_collection_session_id
  if (!rentSessionId) {
    return
  }

  const updates: Record<string, any> = {
    status: 'paid',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as Stripe.PaymentIntent)?.id,
    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
    stripe_invoice_id: typeof session.invoice === 'string' ? session.invoice : undefined,
    stripe_account_id: accountId || null,
  }

  await supabase
    .from('rent_collection_sessions')
    .update(updates)
    .eq('id', rentSessionId)

  const { data: rentSession } = await supabase
    .from('rent_collection_sessions')
    .select('*')
    .eq('id', rentSessionId)
    .maybeSingle()

  if (rentSession) {
    await markRentAsPaidFromSession(rentSession, new Date())
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const rentSessionId = session.metadata?.rent_collection_session_id
  if (!rentSessionId) return

  await supabase
    .from('rent_collection_sessions')
    .update({ status: 'expired' })
    .eq('id', rentSessionId)
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  await syncRentCollectionFromInvoice(invoice, undefined)
}

async function syncRentCollectionFromInvoice(invoice: Stripe.Invoice, status?: 'paid' | 'past_due') {
  const rentSessionId =
    invoice.metadata?.rent_collection_session_id ||
    invoice.lines?.data?.[0]?.metadata?.rent_collection_session_id

  let sessionRecord = null

  if (rentSessionId) {
    const { data } = await supabase
      .from('rent_collection_sessions')
      .select('*')
      .eq('id', rentSessionId)
      .maybeSingle()
    sessionRecord = data
  } else {
    const subscriptionId = (invoice as any).subscription as string | undefined
    if (subscriptionId) {
      const { data } = await supabase
        .from('rent_collection_sessions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle()
      sessionRecord = data
    }
  }

  if (!sessionRecord) {
    return
  }

  const updates: Record<string, any> = {
    stripe_invoice_id: invoice.id,
  }

  if (status) {
    updates.status = status
  }

  await supabase
    .from('rent_collection_sessions')
    .update(updates)
    .eq('id', sessionRecord.id)

  if (status === 'paid') {
    const paidAt = invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : new Date()
    await markRentAsPaidFromSession(sessionRecord, paidAt)
  }
}

async function markRentAsPaidFromSession(sessionRecord: any, paymentDate: Date) {
  try {
    const dueDate = sessionRecord.due_date ? new Date(sessionRecord.due_date) : paymentDate
    const month = dueDate.getMonth() + 1
    const year = dueDate.getFullYear()

    await supabase
      .from('rent_payments')
      .upsert({
        user_id: sessionRecord.user_id,
        property_id: sessionRecord.property_id,
        month,
        year,
        amount: sessionRecord.amount,
        status: 'paid',
        payment_date: paymentDate.toISOString().split('T')[0],
        notes: 'Paid via Stripe Checkout',
      }, { onConflict: 'property_id,month,year' })
  } catch (error) {
    console.error('Failed to mark rent payment from session:', error)
  }
}
