'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { CreditCard, Calendar, Settings, ExternalLink } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/stripe'

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
      const response = await fetch('/api/get-subscription')
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  const getPlanInfo = (plan: string) => {
    return PRICING_PLANS[plan as keyof typeof PRICING_PLANS] || PRICING_PLANS.free
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-gray-600">Manage your subscription and billing</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">{planInfo.name}</div>
                <div className="text-gray-600">
                  {planInfo.properties === -1 ? 'Unlimited' : `Up to ${planInfo.properties}`} Properties
                </div>
                {subscription?.current_period_end && (
                  <div className="text-sm text-gray-500 mt-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Billing date: {formatDate(subscription.current_period_end)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {planInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    {feature}
                  </div>
                ))}
              </div>

              {subscription?.plan === 'free' && (
                <div className="mt-6">
                  <a
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upgrade Plan
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}
            </div>

            {/* Billing Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Settings className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Billing Management</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                  <p className="text-sm text-gray-600">
                    Manage your payment methods and billing information
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Billing History</h3>
                  <p className="text-sm text-gray-600">
                    View and download your billing history and invoices
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Subscription Changes</h3>
                  <p className="text-sm text-gray-600">
                    Upgrade, downgrade, or cancel your subscription
                  </p>
                </div>

                {subscription?.plan !== 'free' && (
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
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
                )}
              </div>
            </div>
          </div>

          {/* Usage Information */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {subscription?.plan === 'free' ? '1' : subscription?.plan === 'starter' ? '5' : '∞'}
                </div>
                <div className="text-sm text-gray-600">Property Limit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {subscription?.status === 'active' ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-600">Subscription Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {planInfo.price === 0 ? 'Free' : `$${planInfo.price}`}
                </div>
                <div className="text-sm text-gray-600">Monthly Cost</div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
