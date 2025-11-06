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
    <div className="min-h-screen relative" style={{ backgroundColor: '#E7F2EF' }}>
      {/* Sign In Link - Top right */}
      <div className="absolute top-6 right-6 z-10">
        <Link
          href="/login"
          className="text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/50"
          style={{ color: '#1C7C63' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#155a47'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#1C7C63'}
        >
          Sign In
        </Link>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="main">
        {/* Header/Hero Section */}
        <div className="pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#0A2540' }}>
                All-in-One Property Management Software for Small Landlords
              </h1>
              <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed" style={{ color: '#0A2540', opacity: 0.9 }}>
                Track rent, expenses, maintenance, and reports — all in one easy dashboard built for landlords with 1–20 units.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                    boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #155a47 0%, #0f4537 100%)'
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(28, 124, 99, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                  }}
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pricing"
                  className="text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                    boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #155a47 0%, #0f4537 100%)'
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(28, 124, 99, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                  }}
                >
                  See Plans
                </Link>
              </div>
            </div>

            {/* Right Column - Hero Visual */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-2xl">
                {/* Placeholder for hero image - laptop + phone view */}
                <div className="relative">
                  {/* Laptop Frame */}
                  <div className="relative bg-white rounded-lg shadow-2xl p-2" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}>
                    <div className="bg-gray-100 rounded-t-lg h-8 flex items-center px-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-lg aspect-video flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E7F2EF' }}>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Dashboard Preview</p>
                        <p className="text-xs text-gray-400 mt-2">Add your hero image here</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phone Frame - Positioned to the right/bottom */}
                  <div className="absolute -bottom-4 -right-4 lg:-bottom-8 lg:-right-8 bg-white rounded-2xl shadow-2xl p-2 w-32 lg:w-48" style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}>
                    <div className="bg-gray-100 rounded-t-xl h-4 lg:h-6 flex items-center justify-center">
                      <div className="w-8 lg:w-12 h-0.5 lg:h-1 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-xl aspect-[9/16] flex items-center justify-center">
                      <div className="text-center p-2 lg:p-4">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-1 lg:mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E7F2EF' }}>
                          <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">Mobile View</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
