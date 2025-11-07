'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import SocialShare from '@/components/SocialShare'
import { PRICING_PLANS } from '@/lib/stripe'
import { Check } from 'lucide-react'

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
      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "LandlordHub",
            "url": "https://landlordhubapp.com",
            "image": "https://landlordhubapp.com/logo_trans.svg",
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "Property Management Software",
            "operatingSystem": "Web",
            "softwareVersion": "1.x",
            "description": "All-in-one property management software for small landlords with 1–20 units. Track rent, expenses, maintenance, vendor contacts, and tax-ready reports—save 10+ hours a month.",
            "keywords": [
              "property management software",
              "landlord software",
              "rent tracking",
              "rental accounting",
              "maintenance tracking",
              "small landlord tools",
              "property management app"
            ],
            "featureList": [
              "Rent collection status and reminders",
              "Expense tracking with tax-ready reports",
              "Maintenance task management",
              "Vendor & tenant contact manager",
              "Portfolio analytics and ROI",
              "Secure document storage"
            ],
            "offers": {
              "@type": "OfferCatalog",
              "name": "Pricing Plans",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "name": "Free",
                  "price": "0",
                  "priceCurrency": "USD",
                  "category": "free",
                  "url": "https://landlordhubapp.com/pricing",
                  "description": "1 property, basic income & expense tracking, maintenance tasks, secure documents",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Basic",
                  "price": "19",
                  "priceCurrency": "USD",
                  "category": "subscription",
                  "url": "https://landlordhubapp.com/pricing",
                  "description": "Manage 2–5 properties, advanced reporting, CSV exports, automated email reminders",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Growth",
                  "price": "29",
                  "priceCurrency": "USD",
                  "category": "subscription",
                  "url": "https://landlordhubapp.com/pricing",
                  "description": "Manage 6–10 properties, enhanced analytics, simplified tax reporting, priority support",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Pro",
                  "price": "39",
                  "priceCurrency": "USD",
                  "category": "subscription",
                  "url": "https://landlordhubapp.com/pricing",
                  "description": "Unlimited properties, advanced analytics, full tax reporting, interactive tenant & vendor management",
                  "availability": "https://schema.org/InStock"
                }
              ]
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "200",
              "bestRating": "5",
              "worstRating": "1"
            },
            "brand": {
              "@type": "Brand",
              "name": "LandlordHub",
              "url": "https://landlordhubapp.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "LandlordHub",
              "url": "https://landlordhubapp.com"
            }
          })
        }}
      />
      
      {/* FAQPage Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Who is LandlordHub designed for?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LandlordHub is designed for small landlords and independent real estate investors who manage between 1 and 20 rental units. It helps simplify rent collection, expense tracking, maintenance, and tax reporting—all from one powerful dashboard."
                }
              },
              {
                "@type": "Question",
                "name": "Is there a free plan available?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. LandlordHub offers a free plan for landlords managing a single property. You can track income and expenses, manage maintenance tasks, and store important documents securely—all at no cost."
                }
              },
              {
                "@type": "Question",
                "name": "How do I get started?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can start free and upgrade anytime as your portfolio grows."
                }
              },
              {
                "@type": "Question",
                "name": "How much time can LandlordHub save me?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LandlordHub users report saving an average of 10+ hours per month by automating rent tracking, maintenance reminders, and expense organization for tax season."
                }
              },
              {
                "@type": "Question",
                "name": "Does LandlordHub work for large property management companies?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "LandlordHub is built specifically for small landlords and independent investors with up to 20 properties. For large-scale portfolios, a dedicated enterprise system may be more suitable."
                }
              },
              {
                "@type": "Question",
                "name": "Can I export reports for taxes and accounting?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. LandlordHub automatically generates tax-ready reports and allows CSV exports for bookkeeping or accountant use. This feature is available in the Basic plan and above."
                }
              },
              {
                "@type": "Question",
                "name": "Is my data secure?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. LandlordHub uses SSL encryption and secure payment systems to protect your information. Your property and financial data are stored safely in the cloud."
                }
              }
            ]
          })
        }}
      />
      
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
        {/* Header/Hero Section with Gradient Background */}
        <section 
          className="hero hero-section"
          style={{ 
            background: 'linear-gradient(115deg, #eaf5f3 0%, #dceceb 100%)'
          }}
        >
          <div className="text-center lg:text-left">
            <h1>All-in-One Property Management Software for Landlords with 1–20 Units</h1>
            
            <p className="subhead">
              Manage rent, expenses, and maintenance in minutes—not hours. LandlordHub helps landlords with 1–20 units stay organized, profitable, and stress-free.
            </p>

            <div className="trust-row">
              <span className="trust-pill">⭐ Rated 4.8 by 200+ landlords</span>
              <span className="trust-pill">✓ Trusted by 1,000+ landlords</span>
            </div>

            <div className="cta-row">
              <Link
                href="/signup"
                className="text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
                style={{ 
                  background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                  boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
                  borderRadius: '8px'
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
                className="text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
              style={{ 
                  background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                  boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
                  borderRadius: '8px'
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

          <div className="hero-mock">
            <div className="device-frame">
              {/* Browser Frame */}
              <div className="browser-frame">
                {/* Browser Address Bar */}
                <div className="browser-address-bar">
                  <div className="browser-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                {/* App Header Bar */}
                <div className="browser-app-header">
                  <img 
                    src="/logo_trans.svg" 
                    alt="LandlordHub"
                    className="browser-logo"
                  />
                </div>
                {/* Dashboard Content */}
                <div className="browser-content">
                  <img 
                    src="/IMG_0614.png" 
                    alt="LandlordHub dashboard preview showing property management features"
                    className="dashboard-screenshot"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <div className="bg-white/80 backdrop-blur-sm py-4 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold" style={{ color: '#1C7C63' }}>
              Trusted by Independent Landlords Nationwide
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div 
          id="features"
          className="mt-20 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              Everything You Need to Manage Your Rentals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ 
                background: 'linear-gradient(135deg, #14B8A6 0%, #1C7C63 100%)'
              }}>
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Manage Properties Easily</h3>
              <p className="text-sm mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>Track rent, tenants, and property data in one place.</p>
              <p className="text-xs" style={{ color: '#1C7C63', fontStyle: 'italic' }}>See all rent and tenant info at a glance — no spreadsheets.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ 
                background: 'linear-gradient(135deg, #3B82F6 0%, #1C7C63 100%)'
              }}>
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Smart Expense Tracking</h3>
              <p className="text-sm mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>Organize transactions automatically for tax reporting.</p>
              <p className="text-xs" style={{ color: '#1C7C63', fontStyle: 'italic' }}>Every expense logged for tax time — automatically.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ 
                background: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)'
              }}>
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Real-Time Reports & Analytics</h3>
              <p className="text-sm mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>Visualize cash flow, ROI, and income vs. expenses instantly.</p>
              <p className="text-xs" style={{ color: '#1C7C63', fontStyle: 'italic' }}>Know your cash flow instantly with visual dashboards.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ 
                background: 'linear-gradient(135deg, #1C7C63 0%, #14B8A6 100%)'
              }}>
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0A2540' }}>Automated Reminders & Maintenance Tracking</h3>
              <p className="text-sm mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>Never miss rent or repair deadlines again.</p>
              <p className="text-xs" style={{ color: '#1C7C63', fontStyle: 'italic' }}>Stay ahead of rent and maintenance deadlines effortlessly.</p>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="mt-16 mb-16 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              See how much time you can save — Try LandlordHub Free
            </h3>
            <Link
              href="/signup"
              className="inline-block text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
              style={{ 
                background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
                borderRadius: '8px'
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
          </div>
        </div>

        {/* Testimonials Section */}
        <div 
          id="testimonials"
          className="mt-20 mb-20"
        >
          <div className="text-center mb-12">
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: '#0A2540' }}>4.8</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">Average rating from 200+ landlords</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#1C7C63' }}>
                  SL
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>Sarah L.</p>
                  <p className="text-xs text-gray-500">Tampa, FL</p>
                </div>
              </div>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#1C7C63' }}>
                  MR
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>Mike R.</p>
                  <p className="text-xs text-gray-500">Austin, TX</p>
                </div>
              </div>
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#1C7C63' }}>
                  JK
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A2540' }}>Jennifer K.</p>
                  <p className="text-xs text-gray-500">Portland, OR</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA After Testimonials */}
          <div className="mt-12 text-center">
            <p className="text-xl font-semibold mb-6" style={{ color: '#0A2540' }}>
              Ready to see why 1,000+ landlords trust LandlordHub?
            </p>
            <Link
              href="/signup"
              className="inline-block text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
              style={{ 
                background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
                borderRadius: '8px'
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
              Get Started Free →
            </Link>
          </div>
        </div>

        {/* Benefit Summary Band */}
        <div className="mt-20 mb-20 py-12 rounded-lg" style={{ backgroundColor: '#E7F2EF' }}>
          <div className="text-center max-w-3xl mx-auto px-4">
            <p className="text-xl md:text-2xl font-semibold" style={{ color: '#0A2540' }}>
              LandlordHub users save an average of 10+ hours a month managing their rentals — see your savings in action.
            </p>
          </div>
        </div>

        {/* Comparison Section */}
        <div 
          id="comparison"
          className="mt-20 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              Why Choose LandlordHub?
            </h2>
            <p className="text-lg mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>
              See how LandlordHub compares to other leading property management tools
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#E7F2EF' }}>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#0A2540' }}>Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#1C7C63', backgroundColor: 'rgba(231, 242, 239, 0.5)' }}>LandlordHub</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#0A2540' }}>Landlord Studio</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#0A2540' }}>Stessa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Designed for landlords with 1-20 units</td>
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-bold text-yellow-600">–</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Free plan available</td>
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-bold text-yellow-600">–</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Track maintenance & vendor contacts</td>
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-bold text-yellow-600">–</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Built-in tax reports</td>
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
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
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xl font-bold text-yellow-600">–</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#F9FAFB' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>Designed for Independent Landlords (Not Large Property Firms)</td>
                    <td className="px-6 py-4 text-center" style={{ backgroundColor: 'rgba(231, 242, 239, 0.3)' }}>
                      <span className="text-2xl text-green-600">✅</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl text-red-500">❌</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Last updated: November 2025
            </p>
          </div>
        </div>

        {/* Pricing CTA Section */}
        <div 
          id="pricing"
          className="mt-20 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              Pricing Plans
            </h2>
            <p className="text-lg mb-2" style={{ color: '#0A2540', opacity: 0.8 }}>
              Best landlord software for small portfolios — start free, upgrade as you grow
            </p>
            <p className="text-sm" style={{ color: '#1C7C63' }}>
              Start free — upgrade anytime
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(PRICING_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${
                  key === 'growth' ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {key === 'growth' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#0A2540', fontWeight: 700 }}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold" style={{ color: '#0A2540' }}>
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {plan.description}
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <Link
                    href="/pricing"
                    className="block w-full text-center text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
                    style={{ 
                      background: key === 'free' 
                        ? 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
                        : 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                      boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (key !== 'free') {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #155a47 0%, #0f4537 100%)'
                        e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(28, 124, 99, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (key !== 'free') {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)'
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                      }
                    }}
                  >
                    Start Free
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Sharing Section */}
        <div className="mt-16 text-center">
          <SocialShare 
            title="LandlordHub - Property Management Software"
            description="Streamline your property management with our comprehensive suite of tools. Track income, manage expenses, schedule maintenance, and generate detailed reports—all in one place."
          />
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mt-20 mb-20">
          <style dangerouslySetInnerHTML={{
            __html: `
              details summary::-webkit-details-marker {
                display: none;
              }
              details summary::marker {
                display: none;
              }
              details[open] summary .faq-icon::before {
                content: '−';
              }
              details:not([open]) summary .faq-icon::before {
                content: '＋';
              }
            `
          }} />
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg" style={{ color: '#0A2540', opacity: 0.8 }}>
              Answers about plans, features, and getting started with LandlordHub
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ Item 1 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>Who is LandlordHub designed for?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                LandlordHub is built for small landlords and independent investors managing <strong>1–20 units</strong>. It centralizes rent tracking, expenses, maintenance, and tax reporting in one dashboard.
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>Is there a free plan?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                Yes—our <strong>Free</strong> plan supports one property with income/expense tracking, maintenance tasks, and secure documents. Upgrade anytime as you grow.
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>How much time can LandlordHub save?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                Users report saving <strong>10+ hours per month</strong> by automating reminders, organizing expenses for taxes, and viewing real-time cash flow/ROI.
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>Can I export reports for taxes and accounting?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                Yes. LandlordHub automatically generates tax-ready reports and allows CSV exports for bookkeeping or accountant use. This feature is available in the Basic plan and above.
              </div>
            </details>

            {/* FAQ Item 5 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>Does LandlordHub work for large property management companies?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                LandlordHub is built specifically for small landlords and independent investors with up to 20 properties. For large-scale portfolios, a dedicated enterprise system may be more suitable.
              </div>
            </details>

            {/* FAQ Item 6 */}
            <details className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md">
              <summary className="font-bold text-lg cursor-pointer list-none flex justify-between items-center" style={{ color: '#0A2540' }}>
                <span>Is my data secure?</span>
                <span className="faq-icon text-2xl" style={{ color: '#1C7C63' }}></span>
              </summary>
              <div className="mt-4 text-gray-700 leading-relaxed">
                Absolutely. LandlordHub uses SSL encryption and secure payment systems to protect your information. Your property and financial data are stored safely in the cloud.
              </div>
            </details>
          </div>
        </div>
      </main>

      {/* Pre-Footer CTA */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 py-12 mt-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xl font-semibold mb-6" style={{ color: '#0A2540' }}>
            Join 1,000+ landlords who simplified their rentals with LandlordHub — try it free today.
          </p>
          <Link
            href="/signup"
            className="inline-block text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
            style={{ 
              background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
              boxShadow: '0 4px 14px 0 rgba(28, 124, 99, 0.3)',
              borderRadius: '8px'
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
        </div>
      </div>

      {/* SEO-Optimized Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>
                About LandlordHub
              </h3>
              <p className="text-sm font-semibold mb-3" style={{ color: '#1C7C63' }}>
                Built by landlords, for landlords — designed to simplify your rental business.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                LandlordHub is the best property management software for small landlords and real estate investors. Whether you manage one rental or twenty, LandlordHub helps you track rent, log expenses, monitor maintenance, and simplify tax reporting — all from one powerful dashboard.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</Link>
                <span className="text-gray-300">·</span>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</Link>
                <span className="text-gray-300">·</span>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>
                Popular Keywords
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  'Property Management App',
                  'Landlord Software',
                  'Rent Tracking',
                  'Rental Accounting',
                  'Maintenance Tracking',
                  'Small Landlord Tools',
                  'Real Estate Investors'
                ].map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} LandlordHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
