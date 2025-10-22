'use client'

import { useState } from 'react'
import { Mail, Loader } from 'lucide-react'

export default function TestReminders() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestReminders = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send test reminders' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Test Email Reminders</h3>
      <p className="text-sm text-gray-600 mb-4">
        This will send reminder emails for maintenance tasks due in 3 days. Use this for testing the email system.
      </p>
      
      <button
        onClick={sendTestReminders}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Send Test Reminders
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Result:</h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
