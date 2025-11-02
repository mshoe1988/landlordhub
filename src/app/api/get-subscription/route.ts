import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // 1) Try active and paid
    const { data: activePaid, error: errActivePaid } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('plan', 'free')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errActivePaid && errActivePaid.code !== 'PGRST116') {
      throw errActivePaid
    }

    if (activePaid) {
      subscription = activePaid
    } else {
      // 2) Fallback to most recent row
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
