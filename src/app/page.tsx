'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import SocialShare from '@/components/SocialShare'

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E7F2EF' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#1C7C63' }}></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E7F2EF' }}>
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" role="main">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/landlord-hub-logo.svg?v=23"
              alt="LandlordHub Logo"
              className="w-auto h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[700px] drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              style={{ 
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#0A2540' }}>
            LandlordHub Simplified property management
          </h1>
          <p className="text-lg mb-12 max-w-3xl mx-auto" style={{ color: '#0A2540' }}>
            Simplify rent collection, expenses, and maintenance in one app. LandlordHub makes property management easy for small landlords — start free today.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              style={{ backgroundColor: '#1C7C63' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#155a47'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1C7C63'}
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="bg-white border px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              style={{ color: '#1C7C63', borderColor: '#1C7C63' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E7F2EF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              View Pricing
            </Link>
            <Link
              href="/login"
              className="bg-white border px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              style={{ color: '#1C7C63', borderColor: '#1C7C63' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E7F2EF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#1C7C63' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0A2540' }}>Property Management</h2>
            <p style={{ color: '#0A2540' }}>Manage multiple properties with ease. Track rent collection, tenant information, and property details.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#1C7C63' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0A2540' }}>Expense Tracking</h2>
            <p style={{ color: '#0A2540' }}>Keep detailed records of all property-related expenses for tax purposes and financial planning.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#1C7C63' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0A2540' }}>Reports & Analytics</h2>
            <p style={{ color: '#0A2540' }}>Generate comprehensive reports for tax filing, financial analysis, and property performance tracking.</p>
          </div>
        </div>

        {/* Social Sharing Section */}
        <div className="mt-16 text-center">
          <SocialShare 
            title="LandlordHub - Property Management Software"
            description="Streamline your property management with our comprehensive suite of tools. Track income, manage expenses, schedule maintenance, and generate detailed reports—all in one place."
          />
        </div>
      </main>
    </div>
  )
}
