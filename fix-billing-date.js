#!/usr/bin/env node

/**
 * Fix billing date for mizerikmate@gmail.com
 * Updates current_period_end to next month
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixBillingDate() {
  try {
    console.log('Fixing billing date for mizerikmate@gmail.com...')
    
    // Get user ID
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail('mizerikmate@gmail.com')
    if (userError || !user) {
      console.error('User not found:', userError)
      return
    }
    
    console.log('User found:', user.user.id)
    
    // Calculate next month
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    console.log('Setting billing date to:', nextMonth.toISOString())
    
    // Update subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        current_period_end: nextMonth.toISOString()
      })
      .eq('user_id', user.user.id)
      .eq('plan', 'pro')
      .select()
    
    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Successfully updated billing date:', data)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixBillingDate()









