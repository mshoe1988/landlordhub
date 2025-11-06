import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return 'starter'  // Map 'basic' plan to 'starter' in database
  } else if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) {
    return 'growth'
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro'
  }
  return 'free'
}

async function syncSubscriptionFromStripe(subscription: any): Promise<any> {
  if (!stripe || !subscription?.stripe_subscription_id) {
    return subscription
  }

  try {
    // Fetch fresh data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
    const priceId = stripeSubscription.items.data[0].price.id
    const plan = getPlanFromPriceId(priceId)
    
    // Update database with fresh data from Stripe
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan,
        status: stripeSubscription.status,
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id)
    
    if (updateError) {
      console.error('Error updating subscription from Stripe sync:', updateError)
      return subscription // Return original if update fails
    }
    
    console.log('Subscription synced from Stripe:', subscription.stripe_subscription_id)
    
    // Return updated subscription
    return {
      ...subscription,
      plan,
      status: stripeSubscription.status,
      current_period_end: currentPeriodEnd.toISOString()
    }
  } catch (error) {
    console.error('Error syncing subscription from Stripe:', error)
    return subscription // Return original if sync fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prefer latest ACTIVE, non-free subscription; fallback to most recent row
    let subscription = null as any

    // 1) Try active and paid (any paid plan)
    // Note: Database uses 'starter' but we also check for 'basic' in case it exists
    const { data: activePaid, error: errActivePaid } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('plan', ['starter', 'basic', 'growth', 'pro'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errActivePaid && errActivePaid.code !== 'PGRST116') {
      throw errActivePaid
    }

    if (activePaid) {
      subscription = activePaid
    } else {
      // 2) Try any active subscription (including free)
      const { data: activeAny, error: errActiveAny } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (errActiveAny && errActiveAny.code !== 'PGRST116') {
        throw errActiveAny
      }

      if (activeAny) {
        subscription = activeAny
      } else {
        // 3) Fallback to most recent row regardless of status
        const { data: latest, error: errLatest } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (errLatest && errLatest.code !== 'PGRST116') {
          throw errLatest
        }
        subscription = latest
      }
    }

    // If subscription exists and billing date is in the past, sync from Stripe
    if (subscription && subscription.current_period_end && subscription.status === 'active' && subscription.stripe_subscription_id) {
      const periodEnd = new Date(subscription.current_period_end)
      const now = new Date()
      
      // If billing date is in the past (more than 1 day ago to account for timezone issues), sync from Stripe
      if (periodEnd.getTime() < (now.getTime() - 24 * 60 * 60 * 1000)) {
        console.log('Billing date is stale, syncing from Stripe...')
        subscription = await syncSubscriptionFromStripe(subscription)
      }
    }

    // Log subscription for debugging
    console.log('Subscription found for user:', user.id, subscription)

    return NextResponse.json({
      subscription: subscription || { plan: 'free', status: 'active' }
    })
  } catch (error) {
    console.error('Error getting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
