'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { CreditCard, Calendar, Settings, ExternalLink, CheckCircle2, FileText, Sparkles, Lightbulb, Rocket, Zap } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string
  stripe_customer_id: string
}

export default function AccountPage() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadSubscription()
    }
  }, [user])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/get-subscription?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        cache: 'no-store'
      })
      const data = await response.json()
      
      // Debug logging
      console.log('Subscription API response:', data)
      console.log('Subscription plan:', data?.subscription?.plan)
      console.log('Subscription status:', data?.subscription?.status)
      
      setSubscription(data.subscription)

      // Store last seen plan for cross-tab banner detection
      if (typeof window !== 'undefined' && data?.subscription?.plan) {
        localStorage.setItem('lh_last_plan', data.subscription.plan)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in again to manage your billing')
        return
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to create portal session'}`)
        return
      }
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(`Error: ${data.error || 'No URL returned'}`)
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert(`Error: ${error}`)
    } finally {
      setPortalLoading(false)
    }
  }

  const getPlanInfo = (plan: string | undefined) => {
    // Map database plan names to PRICING_PLANS keys
    const planMapping: { [key: string]: keyof typeof PRICING_PLANS } = {
      'free': 'free',
      'starter': 'basic',  // Database 'starter' maps to PRICING_PLANS 'basic'
      'basic': 'basic',    // Also handle 'basic' if it exists in database
      'growth': 'growth',
      'pro': 'pro'
    }
    
    if (!plan) {
      console.warn('No plan provided, defaulting to free')
      return PRICING_PLANS.free
    }
    
    const mappedPlan = planMapping[plan.toLowerCase()] || 'free'
    const planInfo = PRICING_PLANS[mappedPlan] || PRICING_PLANS.free
    
    console.log('Plan mapping:', { original: plan, mapped: mappedPlan, planInfo })
    
    return planInfo
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDisplayedBillingDate = (isoString?: string, status?: string) => {
    if (!isoString) return ''
    const periodEnd = new Date(isoString)
    const now = new Date()
    // If for any reason the stored period end is today or in the past,
    // show a sensible next billing date one month from now (display only).
    if (status === 'active' && periodEnd.getTime() <= now.getTime()) {
      const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      return formatDate(inThirtyDays.toISOString())
    }
    return formatDate(isoString)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  const planInfo = getPlanInfo(subscription?.plan || 'free')

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto" style={{ padding: '24px' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#1E293B' }}>Account Settings</h1>
            <p className="mt-2" style={{ color: '#64748B' }}>Manage your subscription and billing</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Plan */}
            <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
              {/* Gradient Header */}
              <div className="mb-6 pb-4 border-b" style={{ background: 'linear-gradient(90deg, #F0F9FA 0%, #FFFFFF 100%)', padding: '16px', margin: '-24px -24px 24px -24px', borderRadius: '16px 16px 0 0', borderBottom: '1px solid #E5E7EB' }}>
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 mr-2" style={{ color: '#1A5F7A' }} />
                  <h2 className="text-lg font-semibold" style={{ color: '#1E293B', fontSize: '18px', fontWeight: 600 }}>Current Plan</h2>
                </div>
              </div>
              
              {/* Plan Badge */}
              <div className="mb-4">
                <span className="text-xs px-2 py-1 rounded-full font-medium inline-block mb-3" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                  ACTIVE PLAN: {planInfo.name.toUpperCase()}
                </span>
              </div>

              {/* Price Visual */}
              <div className="mb-4">
                <div className="text-3xl font-bold mb-2" style={{ color: '#1E293B' }}>
                  ${planInfo.price}
                  <span className="text-base font-normal ml-1" style={{ color: '#94A3B8' }}>/month</span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-6 flex items-center gap-2 text-sm">
                {['Free', 'Basic', 'Growth', 'Pro'].map((tier, index) => {
                  const tiers = ['free', 'basic', 'growth', 'pro']
                  const currentTier = subscription?.plan?.toLowerCase() || 'free'
                  const isActive = tiers[index] === currentTier
                  return (
                    <span key={tier} className="flex items-center gap-1">
                      <span style={{ color: isActive ? '#1A5F7A' : '#94A3B8', fontWeight: isActive ? 600 : 400 }}>
                        {tier}
                      </span>
                      {isActive && <span style={{ color: '#1A5F7A' }}>●</span>}
                      {index < 3 && <span style={{ color: '#E5E7EB' }}>|</span>}
                    </span>
                  )
                })}
              </div>

              {/* Features List */}
              <div className="space-y-3">
                {planInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm" style={{ color: '#64748B' }}>
                    <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: '#10B981' }} />
                    {feature}
                  </div>
                ))}
              </div>

              {subscription?.plan === 'free' && (
                <div className="mt-6">
                  <a
                    href="/pricing"
                    onClick={() => {
                      trackEvent('upgrade_plan_click', {
                        current_plan: 'free',
                        event_category: 'conversion',
                        event_label: 'Upgrade Plan Click (Free User)',
                        conversion_type: 'free_to_paid_intent'
                      })
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#1A5F7A', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#164D61'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A5F7A'}
                  >
                    Upgrade Plan
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}

            </div>

            {/* Billing Management */}
            <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
              {/* Gradient Header */}
              <div className="mb-6 pb-4 border-b" style={{ background: 'linear-gradient(90deg, #F0F9FA 0%, #FFFFFF 100%)', padding: '16px', margin: '-24px -24px 24px -24px', borderRadius: '16px 16px 0 0', borderBottom: '1px solid #E5E7EB' }}>
                <div className="flex items-center mb-2">
                  <Settings className="w-5 h-5 mr-2" style={{ color: '#1A5F7A' }} />
                  <h2 className="text-lg font-semibold" style={{ color: '#1E293B', fontSize: '18px', fontWeight: 600 }}>Billing Management</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <CreditCard className="w-4 h-4 mr-2" style={{ color: '#64748B' }} />
                    <h3 className="font-medium" style={{ color: '#1E293B' }}>Payment Method</h3>
                  </div>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    Manage your payment methods and billing information
                  </p>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2" style={{ color: '#64748B' }} />
                    <h3 className="font-medium" style={{ color: '#1E293B' }}>Billing History</h3>
                  </div>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    View and download your billing history and invoices
                  </p>
                </div>

                {subscription?.current_period_end && subscription?.status === 'active' && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="w-4 h-4 mr-2" style={{ color: '#64748B' }} />
                      <h3 className="font-medium" style={{ color: '#1E293B' }}>Next Billing Date</h3>
                    </div>
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      {getDisplayedBillingDate(subscription.current_period_end, subscription?.status)}
                    </p>
                  </div>
                )}

                {subscription?.plan !== 'free' && (
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#1A5F7A', color: 'white' }}
                      onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#164D61')}
                      onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1A5F7A')}
                    >
                      {portalLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Manage Billing
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                    
                    <a
                      href="/pricing"
                      onClick={() => {
                        trackEvent('change_plan_click', {
                          current_plan: subscription?.plan || 'free',
                          event_category: 'conversion',
                          event_label: 'Change Plan Click',
                          conversion_type: 'plan_change_intent'
                        })
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors border"
                      style={{ borderColor: '#1A5F7A', color: '#1A5F7A', backgroundColor: 'white' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FBFB'
                        e.currentTarget.style.borderColor = '#164D61'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#1A5F7A'
                      }}
                    >
                      Change Plan
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </div>
                )}

                {subscription?.plan === 'free' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Upgrade to a paid plan to access billing management features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Information */}
          <div className="mt-8 rounded-2xl" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', padding: '24px' }}>
            {/* Gradient Header */}
            <div className="mb-6 pb-4 border-b" style={{ background: 'linear-gradient(90deg, #F0F9FA 0%, #FFFFFF 100%)', padding: '16px', margin: '-24px -24px 24px -24px', borderRadius: '16px 16px 0 0', borderBottom: '1px solid #E5E7EB' }}>
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 mr-2" style={{ color: '#1A5F7A' }} />
                <h2 className="text-lg font-semibold" style={{ color: '#1E293B', fontSize: '18px', fontWeight: 600 }}>Usage Information</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: '#64748B' }}>Properties</span>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700 }}>
                  {planInfo.properties === -1 ? 'Unlimited' : String(planInfo.properties)}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>✅ Active</div>
                {planInfo.properties !== -1 && (
                  <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                    <div className="h-1 rounded-full" style={{ backgroundColor: '#1A5F7A', width: '100%' }}></div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: '#64748B' }}>Subscription</span>
                  <span className="text-lg">💎</span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700 }}>
                  {planInfo.name}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>💎 Premium</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: '#64748B' }}>Billing</span>
                  <Calendar className="w-4 h-4" style={{ color: '#64748B' }} />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: '#0F172A', fontSize: '16px', fontWeight: 700 }}>
                  {planInfo.price === 0 ? 'Free' : `$${planInfo.price}`}/month
                </div>
                {subscription?.current_period_end && (
                  <div className="text-xs" style={{ color: '#94A3B8' }}>
                    📅 Next: {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Smart Insight Card */}
          <div className="mt-8 rounded-xl p-4" style={{ backgroundColor: '#F8FBFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1A5F7A' }} />
              <div className="flex-1">
                <p className="text-sm mb-2" style={{ color: '#475569', fontStyle: 'italic' }}>
                  <span className="font-semibold not-italic" style={{ color: '#1E293B' }}>💡 Pro Tip:</span>{' '}
                  You're saving an average of 3 hours/week with LandlordHub Pro. Explore "Reports" to see your ROI in action.
                </p>
                <a 
                  href="/reports"
                  className="inline-flex items-center text-sm font-medium mt-2 transition-colors"
                  style={{ color: '#1A5F7A' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#164D61'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#1A5F7A'}
                >
                  View Reports
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
