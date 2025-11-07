import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildRentCollectionEmail } from '@/lib/emails/rentCollection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const getAppUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://landlordhubapp.com'

interface CollectRentPayload {
  propertyId: string
  amount?: number
  currency?: string
  dueDate?: string
  description?: string
  tenantEmail?: string
  tenantPhone?: string
  isRecurring?: boolean
}

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

    const body = (await request.json()) as CollectRentPayload
    const {
      propertyId,
      amount: requestedAmount,
      currency = 'usd',
      dueDate,
      description,
      tenantEmail,
      tenantPhone,
      isRecurring = false,
    } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id, address, monthly_rent, tenant_email, tenant_name, nickname')
      .eq('id', propertyId)
      .maybeSingle()

    if (propertyError || !property || property.user_id !== user.id) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const finalAmount = typeof requestedAmount === 'number' ? requestedAmount : Number(property.monthly_rent)
    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const finalTenantEmail = tenantEmail || property.tenant_email
    if (!finalTenantEmail) {
      return NextResponse.json({ error: 'Tenant email is required to send the payment link' }, { status: 400 })
    }

    // Ensure landlord has a connected Stripe account
    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!connectAccount) {
      return NextResponse.json({
        error: 'Stripe account not connected. Please complete Stripe onboarding.',
        requiresOnboarding: true,
      }, { status: 400 })
    }

    // Fetch latest account status to ensure charges enabled
    const account = await stripe.accounts.retrieve(connectAccount.stripe_account_id)
    if (!account.charges_enabled) {
      return NextResponse.json({
        error: 'Stripe account is not ready to accept payments yet. Please complete onboarding.',
        requiresOnboarding: true,
      }, { status: 400 })
    }

    const sessionId = crypto.randomUUID()

    await supabase.from('rent_collection_sessions').insert({
      id: sessionId,
      user_id: user.id,
      property_id: propertyId,
      amount: finalAmount,
      currency,
      due_date: dueDate || null,
      description: description || null,
      tenant_email: finalTenantEmail,
      tenant_phone: tenantPhone || null,
      is_recurring: isRecurring,
      status: 'open',
      stripe_account_id: connectAccount.stripe_account_id,
    })

    const appUrl = getAppUrl()
    const readableAddress = property.nickname || property.address
    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : undefined
    const productName = formattedDueDate
      ? `Rent for ${readableAddress} (${formattedDueDate})`
      : `Rent for ${readableAddress}`

    const metadata = {
      rent_collection_session_id: sessionId,
      landlordhub_user_id: user.id,
      property_id: propertyId,
    }

    const lineItem = {
      price_data: {
        currency,
        unit_amount: Math.round(finalAmount * 100),
        product_data: {
          name: productName,
        },
      },
      quantity: 1,
    }

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: isRecurring ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      customer_email: finalTenantEmail,
      metadata,
      line_items: [lineItem],
      success_url: `${appUrl}/rent-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/properties?collectCancelled=true`,
      automatic_tax: { enabled: false },
      phone_number_collection: { enabled: !!tenantPhone },
    }

    if (isRecurring) {
      checkoutParams.subscription_data = {
        metadata,
      }
    } else {
      checkoutParams.payment_intent_data = {
        metadata,
      }
    }

    const session = await stripe.checkout.sessions.create(checkoutParams, {
      stripeAccount: connectAccount.stripe_account_id,
    })

    await supabase
      .from('rent_collection_sessions')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_link_url: session.url,
        stripe_subscription_id: (session.subscription as string) || null,
      })
      .eq('id', sessionId)

    // Send tenant email if Resend configured
    if (resend) {
      try {
        const landlordName = user.user_metadata?.full_name || user.email || 'Your landlord'
        const { subject, html, text } = buildRentCollectionEmail({
          landlordName,
          propertyAddress: readableAddress,
          amount: finalAmount,
          dueDate,
          checkoutUrl: session.url!,
          recurring: isRecurring,
        })

        await resend.emails.send({
          from: 'LandlordHub <no-reply@landlordhub.com>',
          to: [finalTenantEmail],
          subject,
          html,
          text,
        })

        await supabase
          .from('rent_collection_sessions')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', sessionId)
      } catch (emailError) {
        console.error('Failed to send rent collection email:', emailError)
      }
    }

    return NextResponse.json({
      id: sessionId,
      checkoutUrl: session.url,
      status: 'open',
    })
  } catch (error) {
    console.error('Error creating rent collection checkout session:', error)
    return NextResponse.json({ error: 'Failed to create rent collection session' }, { status: 500 })
  }
}
