import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://landlordhubapp.com'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load or create connect account record
    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    let stripeAccountId = existingAccount?.stripe_account_id

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: user.email || undefined,
        metadata: {
          landlordhub_user_id: user.id,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      stripeAccountId = account.id

      await supabase.from('stripe_connect_accounts').upsert({
        user_id: user.id,
        stripe_account_id: account.id,
        details_submitted: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
      })
    }

    // Retrieve account to get latest status
    const account = await stripe.accounts.retrieve(stripeAccountId)

    await supabase
      .from('stripe_connect_accounts')
      .upsert({
        user_id: user.id,
        stripe_account_id: stripeAccountId,
        details_submitted: account.details_submitted || false,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
      })

    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || `${getAppUrl()}/stripe/onboarding/refresh`
    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL || `${getAppUrl()}/stripe/onboarding/return`

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: account.details_submitted ? 'account_update' : 'account_onboarding',
    })

    return NextResponse.json({
      url: link.url,
      account: {
        id: stripeAccountId,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account link:', error)
    return NextResponse.json({ error: 'Failed to create Stripe account link' }, { status: 500 })
  }
}
