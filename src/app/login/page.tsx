'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { trackLogin } from '@/lib/analytics'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        // Success! Track login and redirect to dashboard
        trackLogin('email')
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#E7F2EF' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
            <img
              src="/landlord-hub-logo.svg?v=21"
              alt="LandlordHub Logo"
              className="w-auto h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[600px] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ 
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: '#0A2540' }}>
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: '#0A2540' }}>
            Or{' '}
            <Link href="/signup" className="font-medium transition-colors" style={{ color: '#1C7C63' }} onMouseEnter={(e) => e.currentTarget.style.color = '#155a47'} onMouseLeave={(e) => e.currentTarget.style.color = '#1C7C63'}>
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#0A2540' }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:z-10 sm:text-sm"
                style={{ color: '#0A2540' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1C7C63'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28, 124, 99, 0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#0A2540' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:z-10 sm:text-sm"
                  style={{ color: '#0A2540' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1C7C63'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28, 124, 99, 0.1)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 transition-colors"
                  style={{ color: '#0A2540' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1C7C63'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#0A2540'}
                >
                  {showPassword ? (
                    // Heroicons: eye-slash
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 3.6 16.3 2 14c.6-.9 1.6-2.2 3-3.5" />
                      <path d="M10.58 10.58A2 2 0 1 0 13.42 13.42" />
                      <path d="M1 1l22 22" />
                      <path d="M9.88 4.12A10.94 10.94 0 0 1 12 4c5 0 8.4 3.7 10 6-.4.6-.9 1.3-1.6 2" />
                    </svg>
                  ) : (
                    // Heroicons: eye
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium transition-colors" style={{ color: '#1C7C63' }} onMouseEnter={(e) => e.currentTarget.style.color = '#155a47'} onMouseLeave={(e) => e.currentTarget.style.color = '#1C7C63'}>
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#1C7C63' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#155a47')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1C7C63')}
              onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28, 124, 99, 0.3)'}
              onBlur={(e) => e.currentTarget.style.boxShadow = ''}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
