'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Check, X, Star } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/stripe'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(plan)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan === 'starter' ? process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
          plan,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(null)
    }
  }

  const plans = Object.entries(PRICING_PLANS).map(([key, plan]) => ({
    key,
    ...plan,
  }))

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
                  plan.key === 'starter' ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.key === 'starter' && (
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
                  <p className="text-gray-600">
                    {plan.properties === -1 ? 'Unlimited' : `Up to ${plan.properties}`} Properties
                  </p>
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
                      onClick={() => handleSubscribe(plan.key as 'starter' | 'pro')}
                      disabled={loading === plan.key}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                        plan.key === 'starter'
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
