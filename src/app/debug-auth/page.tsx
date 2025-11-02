'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      setResult(`Current session: ${session ? 'Active' : 'None'}`)
    })
  }, [])

  const testSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('Signing in...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setResult(`❌ Error: ${error.message}`)
      } else {
        setResult(`✅ Success! User: ${data.user?.email}`)
        setSession(data.session)
        
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

  const testSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setResult('Signed out')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Debug Authentication</h1>
      <p>This page tests authentication directly with the main app's Supabase client.</p>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Current Session:</strong> {session ? `Active (${session.user?.email})` : 'None'}
      </div>
      
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
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Signing in...' : 'Test Sign In'}
        </button>
        <button
          type="button"
          onClick={testSignOut}
          style={{
            padding: '10px 20px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Sign Out
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
