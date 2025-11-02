'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'

// Disable caching for the homepage to ensure latest content
export const dynamic = 'force-dynamic'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                src="/landlord-hub-logo.svg?v=23"
                alt="LandlordHub Logo"
                width={600}
                height={240}
                className="mr-3 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                priority
                quality={100}
              />
            </div>
            {/* Removed header Sign In/Sign Up to avoid duplication with hero CTAs */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/landlord-hub-logo.svg?v=23"
              alt="LandlordHub Logo"
              width={700}
              height={280}
              className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              priority
              quality={100}
              style={{ 
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                backgroundImage: 'none !important'
              }}
            />
          </div>
          {/* Tagline removed; it's included in the logo */}
          <p className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto">
            Streamline your property management with our comprehensive suite of tools. 
            Track income, manage expenses, schedule maintenance, and generate detailed reports—all in one place.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Property Management</h3>
            <p className="text-gray-600">Manage multiple properties with ease. Track rent collection, tenant information, and property details.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Expense Tracking</h3>
            <p className="text-gray-600">Keep detailed records of all property-related expenses for tax purposes and financial planning.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
            <p className="text-gray-600">Generate comprehensive reports for tax filing, financial analysis, and property performance tracking.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
