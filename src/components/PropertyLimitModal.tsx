'use client'

import { useState } from 'react'
import { X, AlertTriangle, ArrowRight } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/stripe'

interface PropertyLimitModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  currentCount: number
}

export default function PropertyLimitModal({ 
  isOpen, 
  onClose, 
  currentPlan, 
  currentCount 
}: PropertyLimitModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  const getPlanInfo = (plan: string) => {
    return PRICING_PLANS[plan as keyof typeof PRICING_PLANS] || PRICING_PLANS.free
  }

  const currentPlanInfo = getPlanInfo(currentPlan)
  const starterPlan = PRICING_PLANS.starter
  const proPlan = PRICING_PLANS.pro

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Property Limit Reached
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    You've reached the limit of {currentPlanInfo.properties} properties on your {currentPlanInfo.name} plan. 
                    Upgrade to add more properties and unlock additional features.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Starter Plan */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 p-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900">{starterPlan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${starterPlan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Up to {starterPlan.properties} Properties
                  </p>
                </div>
                
                <ul className="mt-4 space-y-2">
                  {starterPlan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade('starter')}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Starter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white rounded-lg p-4 border-2 border-blue-600 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                </div>
                
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900">{proPlan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${proPlan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Unlimited Properties
                  </p>
                </div>
                
                <ul className="mt-4 space-y-2">
                  {proPlan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading}
                  className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                Maybe Later
              </button>
              <a
                href="/pricing"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
