'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { trackSignUp } from '@/lib/analytics'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      trackSignUp('email')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ 
          background: 'linear-gradient(135deg, rgba(231, 242, 239, 0.95) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 253, 250, 0.9) 100%)',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(28, 124, 99, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)'
        }}
      >
        <div className="max-w-md w-full">
          <div 
            className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 text-center"
            style={{
              boxShadow: '0 20px 60px rgba(15, 42, 61, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="flex justify-center mb-6">
              <img
                src="/landlord-hub-logo.svg?v=15"
                alt="LandlordHub Logo"
                className="w-auto h-auto max-w-[200px] sm:max-w-[240px] drop-shadow-lg"
                style={{ 
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  backgroundImage: 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#0A2540', fontWeight: 700 }}>
              Check your email
            </h2>
            <p className="text-base mb-8" style={{ color: '#0A2540', opacity: 0.8 }}>
              We've sent you a confirmation link. Please check your email and click the link to verify your account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ 
        background: 'linear-gradient(135deg, rgba(231, 242, 239, 0.95) 0%, rgba(255, 255, 255, 1) 50%, rgba(240, 253, 250, 0.9) 100%)',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(28, 124, 99, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(20, 184, 166, 0.05) 0%, transparent 50%)'
      }}
    >
      <div className="max-w-md w-full">
        {/* Signup Card Container */}
        <div 
          className="bg-white rounded-2xl shadow-xl p-8 sm:p-10"
          style={{
            boxShadow: '0 20px 60px rgba(15, 42, 61, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/landlord-hub-logo.svg?v=15"
                alt="LandlordHub Logo"
                className="w-auto h-auto max-w-[200px] sm:max-w-[240px] drop-shadow-lg"
                style={{ 
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  backgroundImage: 'none',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#0A2540', fontWeight: 700 }}>
              Get Started — It's Free
            </h2>
            <p className="text-base font-medium mb-1" style={{ color: '#1C7C63' }}>
              Join 1,000+ landlords simplifying their rentals
            </p>
            <p className="text-sm mt-4" style={{ color: '#0A2540', opacity: 0.7 }}>
              Or{' '}
              <Link href="/login" className="font-semibold transition-colors" style={{ color: '#1C7C63' }} onMouseEnter={(e) => e.currentTarget.style.color = '#155a47'} onMouseLeave={(e) => e.currentTarget.style.color = '#1C7C63'}>
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              {/* Email Field */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="peer w-full px-4 py-3.5 border-2 rounded-lg text-base transition-all duration-200 focus:outline-none"
                  style={{ 
                    color: '#0A2540',
                    borderColor: email ? '#1C7C63' : '#d1d5db',
                    backgroundColor: email ? '#f9fafb' : '#ffffff'
                  }}
                  onFocus={(e) => { 
                    e.currentTarget.style.borderColor = '#1C7C63'
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(28, 124, 99, 0.1)'
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                  onBlur={(e) => { 
                    if (!email) {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }
                    e.currentTarget.style.boxShadow = ''
                  }}
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-3.5 text-sm font-medium transition-all duration-200 pointer-events-none"
                  style={{
                    color: email ? '#1C7C63' : '#6b7280',
                    transform: email ? 'translateY(-1.75rem) scale(0.85)' : 'translateY(0) scale(1)',
                    backgroundColor: email ? '#ffffff' : 'transparent',
                    paddingLeft: email ? '0.25rem' : '0',
                    paddingRight: email ? '0.25rem' : '0'
                  }}
                >
                  Email address
                </label>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="peer w-full px-4 py-3.5 pr-12 border-2 rounded-lg text-base transition-all duration-200 focus:outline-none"
                    style={{ 
                      color: '#0A2540',
                      borderColor: password ? '#1C7C63' : '#d1d5db',
                      backgroundColor: password ? '#f9fafb' : '#ffffff'
                    }}
                    onFocus={(e) => { 
                      e.currentTarget.style.borderColor = '#1C7C63'
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(28, 124, 99, 0.1)'
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                    onBlur={(e) => { 
                      if (!password) {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }
                      e.currentTarget.style.boxShadow = ''
                    }}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-3.5 text-sm font-medium transition-all duration-200 pointer-events-none"
                    style={{
                      color: password ? '#1C7C63' : '#6b7280',
                      transform: password ? 'translateY(-1.75rem) scale(0.85)' : 'translateY(0) scale(1)',
                      backgroundColor: password ? '#ffffff' : 'transparent',
                      paddingLeft: password ? '0.25rem' : '0',
                      paddingRight: password ? '0.25rem' : '0'
                    }}
                  >
                    Password (min 6 characters)
                  </label>
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 transition-colors"
                    style={{ color: '#6b7280' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C63'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 3.6 16.3 2 14c.6-.9 1.6-2.2 3-3.5" />
                        <path d="M10.58 10.58A2 2 0 1 0 13.42 13.42" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 4.12A10.94 10.94 0 0 1 12 4c5 0 8.4 3.7 10 6-.4.6-.9 1.3-1.6 2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="peer w-full px-4 py-3.5 pr-12 border-2 rounded-lg text-base transition-all duration-200 focus:outline-none"
                    style={{ 
                      color: '#0A2540',
                      borderColor: confirmPassword ? '#1C7C63' : '#d1d5db',
                      backgroundColor: confirmPassword ? '#f9fafb' : '#ffffff'
                    }}
                    onFocus={(e) => { 
                      e.currentTarget.style.borderColor = '#1C7C63'
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(28, 124, 99, 0.1)'
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                    onBlur={(e) => { 
                      if (!confirmPassword) {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }
                      e.currentTarget.style.boxShadow = ''
                    }}
                    placeholder=" "
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <label
                    htmlFor="confirmPassword"
                    className="absolute left-4 top-3.5 text-sm font-medium transition-all duration-200 pointer-events-none"
                    style={{
                      color: confirmPassword ? '#1C7C63' : '#6b7280',
                      transform: confirmPassword ? 'translateY(-1.75rem) scale(0.85)' : 'translateY(0) scale(1)',
                      backgroundColor: confirmPassword ? '#ffffff' : 'transparent',
                      paddingLeft: confirmPassword ? '0.25rem' : '0',
                      paddingRight: confirmPassword ? '0.25rem' : '0'
                    }}
                  >
                    Confirm Password
                  </label>
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 transition-colors"
                    style={{ color: '#6b7280' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C63'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 3.6 16.3 2 14c.6-.9 1.6-2.2 3-3.5" />
                        <path d="M10.58 10.58A2 2 0 1 0 13.42 13.42" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 4.12A10.94 10.94 0 0 1 12 4c5 0 8.4 3.7 10 6-.4.6-.9 1.3-1.6 2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-lg text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)',
                  boxShadow: loading ? '0 4px 14px 0 rgba(28, 124, 99, 0.2)' : '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #155a47 0%, #0f4537 100%)'
                    e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(28, 124, 99, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1C7C63 0%, #155a47 100%)'
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(28, 124, 99, 0.3)'
                  }
                }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(28, 124, 99, 0.2), 0 4px 14px 0 rgba(28, 124, 99, 0.3)'}
                onBlur={(e) => e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(28, 124, 99, 0.3)'}
              >
                {loading ? 'Creating account...' : 'Get Started Free'}
              </button>
              
              {/* Reassurance Text */}
              <p className="mt-4 text-center text-xs" style={{ color: '#6b7280' }}>
                No credit card required • Cancel anytime
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
