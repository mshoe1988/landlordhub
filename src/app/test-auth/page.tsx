'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('Signing in...')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult(`Success! User: ${data.user?.email}`)
      }
    } catch (err: any) {
      setResult(`Exception: ${err.message}`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Test Authentication</h1>
      <form onSubmit={handleSignIn}>
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
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
        <strong>Result:</strong> {result}
      </div>
    </div>
  )
}









