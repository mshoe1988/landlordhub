'use client'

import { useState } from 'react'

export default function SimpleTestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testSupabase = async () => {
    setLoading(true)
    setResult('Testing...')

    try {
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      setResult(`URL: ${url}\nKey: ${key ? 'Present' : 'Missing'}\n\n`)

      if (!url || !key) {
        setResult(prev => prev + '❌ Environment variables missing!')
        return
      }

      // Test 2: Create Supabase client
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(url, key)
      
      setResult(prev => prev + '✅ Supabase client created\n')

      // Test 3: Test database connection
      const { data, error } = await supabase
        .from('properties')
        .select('count')
        .limit(1)

      if (error) {
        setResult(prev => prev + `❌ Database error: ${error.message}\n`)
      } else {
        setResult(prev => prev + '✅ Database connection successful\n')
      }

      // Test 4: Test authentication
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        setResult(prev => prev + `❌ Auth error: ${authError.message}\n`)
      } else {
        setResult(prev => prev + `✅ Auth working - Session: ${authData.session ? 'Active' : 'None'}\n`)
      }

    } catch (err: any) {
      setResult(prev => prev + `❌ Exception: ${err.message}\n`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Supabase Test</h1>
      <button 
        onClick={testSupabase}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Supabase Connection'}
      </button>
      
      <div style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        background: '#f5f5f5',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        {result || 'Click the button to test...'}
      </div>
    </div>
  )
}











