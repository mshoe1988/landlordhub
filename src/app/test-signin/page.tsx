'use client'

import { useState } from 'react'

export default function TestSignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('Signing in...')

    try {
      // Import Supabase dynamically
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data.user?.email}`)
        
        // Test if session persists
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession()
          setResult(prev => prev + `\n\nSession check: ${sessionData.session ? 'Active' : 'None'}`)
        }, 1000)
      }
    } catch (err: any) {
      setResult(`❌ Exception: ${err.message}`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Sign-In</h1>
      <p>This page tests the sign-in process directly.</p>
      
      <form onSubmit={testSignIn} style={{ marginBottom: '20px' }}>
        <div style={{ margin: '10px 0' }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Signing in...' : 'Test Sign In'}
        </button>
      </form>
      
      <div style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        background: '#f5f5f5',
        padding: '15px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        {result || 'Enter your credentials and click "Test Sign In"...'}
      </div>
    </div>
  )
}





