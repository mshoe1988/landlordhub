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
              {/* Trust Indicator */}
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#1C7C63' }}>
                  Trusted by 1,000+ landlords
                </p>
              </div>
              
              {/* Tagline */}
              <p className="text-lg md:text-xl font-semibold mb-4" style={{ color: '#1C7C63' }}>
                Simplify Life. Maximize Rentals. Save 10+ Hours a Month.
              </p>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#0A2540' }}>
                All-in-One Property Management Software for Small Landlords
              </h1>
              <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed" style={{ color: '#0A2540', opacity: 0.9 }}>
                Manage rent, expenses, and maintenance in minutes — not hours. LandlordHub helps landlords with 1–20 units stay organized, profitable, and stress-free.
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

        {/* Features Section */}
        <div className="mt-20 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540' }}>
              Everything You Need to Manage Your Properties
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Manage Properties Easily</h3>
              <p style={{ color: '#0A2540', opacity: 0.8 }}>Track rent, tenants, and property data in one place.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Smart Expense Tracking</h3>
              <p style={{ color: '#0A2540', opacity: 0.8 }}>Organize transactions automatically for tax reporting.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Real-Time Reports & Analytics</h3>
              <p style={{ color: '#0A2540', opacity: 0.8 }}>Visualize cash flow, ROI, and income vs. expenses instantly.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#E7F2EF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Automated Reminders & Maintenance Tracking</h3>
              <p style={{ color: '#0A2540', opacity: 0.8 }}>Never miss rent or repair deadlines again.</p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-20 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540' }}>
              What Our Users Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63', opacity: 0.3 }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Finally, a property management tool that's simple but powerful enough for independent landlords."
              </p>
              <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>
                – Sarah L., Tampa, FL
              </p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63', opacity: 0.3 }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "LandlordHub has saved me hours every month. The expense tracking alone is worth it for tax season."
              </p>
              <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>
                – Mike R., Austin, TX
              </p>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1C7C63', opacity: 0.3 }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "As someone managing 8 units, this tool keeps everything organized. The maintenance tracking is a game-changer."
              </p>
              <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>
                – Jennifer K., Portland, OR
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mt-20 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540' }}>
              Why Choose LandlordHub?
            </h2>
            <p className="text-lg" style={{ color: '#0A2540', opacity: 0.8 }}>
              See how we compare to other property management tools
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#E7F2EF' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#0A2540' }}>Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#1C7C63' }}>LandlordHub</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#0A2540' }}>Landlord Studio</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#0A2540' }}>Stessa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Designed for landlords with 1-20 units</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-yellow-500">⚠️</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Free plan available</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-yellow-500">⚠️</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Track maintenance & vendor contacts</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-yellow-500">⚠️</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Built-in tax reports</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Easy-to-use dashboard</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-yellow-500">⚠️</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
