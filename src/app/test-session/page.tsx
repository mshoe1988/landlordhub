'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSessionPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('Auth state changed:', event, session)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Current Session:</h2>
        {session ? (
          <div>
            <p><strong>User:</strong> {session.user?.email}</p>
            <p><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            <p><strong>Access Token:</strong> {session.access_token ? 'Present' : 'Missing'}</p>
          </div>
        ) : (
          <p>No active session</p>
        )}
      </div>

      <div className="mt-4">
        <button 
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession()
            console.log('Manual session check:', session)
            setSession(session)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Refresh Session
        </button>
        
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            setSession(null)
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
