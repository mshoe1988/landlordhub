'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Check, X, Star } from 'lucide-react'
import { PRICING_PLANS, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)

  useEffect(() => {
    if (user) {
      checkExistingSubscription()
    }
  }, [user])

  const checkExistingSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/get-subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()
      
      if (data.subscription && data.subscription.status === 'active' && data.subscription.plan !== 'free') {
        setHasSubscription(true)
        // Don't redirect - allow users to upgrade between paid plans
      } else {
        setHasSubscription(false)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setHasSubscription(false)
    }
  }

  const handleSubscribe = async (plan: 'basic' | 'growth' | 'pro') => {
    console.log('handleSubscribe called with plan:', plan)
    
    // Track upgrade intent
    trackEvent('upgrade_intent', {
      plan_name: plan,
      plan_value: PRICING_PLANS[plan].price,
      event_category: 'conversion',
      event_label: `Upgrade to ${plan}`,
      conversion_type: 'upgrade_click'
    })
    
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    console.log('User found:', user.id)
    setLoading(plan)
    try {
      console.log('Getting session...')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }
      console.log('Session found, creating checkout session...')

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan,
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      } else if (data.redirectToPortal) {
        console.log('Redirecting to customer portal')
        // Create a fresh portal session and redirect to Stripe Customer Portal
        try {
          const portalRes = await fetch('/api/create-portal-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          
          if (!portalRes.ok) {
            const errorData = await portalRes.json()
            console.error('Portal session error:', errorData)
            alert(`Error: ${errorData.error || 'Failed to create portal session'}. Please ensure Stripe Customer Portal is enabled in your Stripe Dashboard.`)
            window.location.href = '/account'
            return
          }
          
          const portalData = await portalRes.json()
          if (portalData.url) {
            window.location.href = portalData.url
          } else {
            // Fallback: go to Account with instruction
            console.error('No URL in portal response:', portalData)
            alert('Opening billing portal failed. Taking you to Account to manage billing.')
            window.location.href = '/account'
          }
        } catch (e) {
          console.error('Portal session exception:', e)
          alert('Could not open billing portal. Please try from Account → Manage Billing.')
          window.location.href = '/account'
        }
      } else {
        console.error('No URL returned:', data)
        alert(`Error: ${data.error || 'No URL returned'}`)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert(`Error: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  const plans = Object.entries(PRICING_PLANS).map(([key, plan]) => ({
    key,
    ...plan,
  }))

  // Show loading while checking subscription
  if (hasSubscription === null) {
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

  // Show message for existing subscribers
  // Allow all users to access pricing page for plan changes

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600">
              Start with our free plan and upgrade as your portfolio grows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.key === 'basic' ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.key === 'basic' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-gray-600 mb-4 text-sm">
                      {plan.description}
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {plan.key === 'free' ? (
                    <div className="bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.key as 'basic' | 'growth' | 'pro')}
                      disabled={loading === plan.key}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                        plan.key === 'basic'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === plan.key ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens if I exceed my property limit?
                </h3>
                <p className="text-gray-600">
                  You'll be prompted to upgrade your plan when you try to add more properties than your current plan allows.
                </p>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Our free plan allows you to manage 1 property with full features. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
