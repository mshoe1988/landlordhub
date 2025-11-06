'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { trackSignUp } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      
      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      } else {
        trackSignUp('google')
        // OAuth redirect will happen automatically
      }
    } catch (err: any) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      
      if (error) {
        setError(error.message)
        setFacebookLoading(false)
      } else {
        trackSignUp('facebook')
        // OAuth redirect will happen automatically
      }
    } catch (err: any) {
      setError(err.message)
      setFacebookLoading(false)
    }
  }

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
          background: 'radial-gradient(circle at 50% 30%, #e8f4f3 0%, #dceceb 100%)'
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
        background: 'radial-gradient(circle at 50% 30%, #e8f4f3 0%, #dceceb 100%)'
      }}
    >
      <div className="max-w-md w-full">
        {/* Signup Card Container */}
        <div 
          className="bg-white rounded-2xl shadow-xl px-8 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-7"
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
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-lg text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ 
                  background: 'linear-gradient(180deg, #0f6e5f 0%, #0d5b52 100%)',
                  boxShadow: loading ? '0 4px 12px rgba(15,110,95,0.18)' : '0 4px 12px rgba(15,110,95,0.18)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,110,95,0.25)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,110,95,0.18)'
                  }
                }}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(15,110,95,0.2), 0 4px 12px rgba(15,110,95,0.18)'}
                onBlur={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,110,95,0.18)'}
              >
                {loading ? 'Creating account...' : 'Get Started Free'}
              </button>
              
              {/* Reassurance Text */}
              <p className="mt-4 text-center text-xs" style={{ color: '#6b7280' }}>
                Cancel anytime
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#e5e7eb' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span style={{ color: '#6b7280', backgroundColor: '#ffffff', padding: '0 1rem' }}>
                  or
                </span>
              </div>
            </div>

            {/* Social Sign-In Buttons */}
            <div className="space-y-3">
              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading || facebookLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{
                  background: '#ffffff',
                  borderColor: '#cbd5d8',
                  color: '#1f2937'
                }}
                onMouseEnter={(e) => {
                  if (!googleLoading && !loading && !facebookLoading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!googleLoading && !loading && !facebookLoading) {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#cbd5d8'
                  }
                }}
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#1f2937' }}></div>
                ) : (
                  <>
                    {/* Google Icon SVG */}
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <g fill="none" fillRule="evenodd">
                        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.348 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </g>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Facebook Sign-In Button */}
              <button
                type="button"
                onClick={handleFacebookSignIn}
                disabled={facebookLoading || loading || googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#1877F2',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!facebookLoading && !loading && !googleLoading) {
                    e.currentTarget.style.backgroundColor = '#166FE5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!facebookLoading && !loading && !googleLoading) {
                    e.currentTarget.style.backgroundColor = '#1877F2'
                  }
                }}
              >
                {facebookLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    {/* Facebook Icon SVG */}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 9a9 9 0 1 0-10.406 8.89v-6.288H5.309V9h2.285V7.017c0-2.255 1.343-3.501 3.4-3.501.985 0 2.014.175 2.014.175v2.215h-1.135c-1.118 0-1.467.694-1.467 1.406V9h2.496l-.399 2.602h-2.097v6.288A9.001 9.001 0 0 0 18 9z"/>
                    </svg>
                    <span>Continue with Facebook</span>
                  </>
                )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
