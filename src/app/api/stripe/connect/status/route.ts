import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!connectAccount) {
      return NextResponse.json({ connected: false })
    }

    if (!stripe) {
      return NextResponse.json({
        connected: false,
        account: connectAccount,
        warning: 'Stripe not configured on server',
      })
    }

    const account = await stripe.accounts.retrieve(connectAccount.stripe_account_id)

    const updates = {
      user_id: user.id,
      stripe_account_id: connectAccount.stripe_account_id,
      details_submitted: account.details_submitted || false,
      charges_enabled: account.charges_enabled || false,
      payouts_enabled: account.payouts_enabled || false,
    }

    await supabase.from('stripe_connect_accounts').upsert(updates)

    return NextResponse.json({
      connected: account.charges_enabled && account.payouts_enabled,
      account: updates,
      requirements: account.requirements,
    })
  } catch (error) {
    console.error('Error fetching Stripe Connect status:', error)
    return NextResponse.json({ error: 'Failed to load Stripe status' }, { status: 500 })
  }
}
