'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function RentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4">Rent payment received</h1>
        <p className="text-sm text-slate-600 mt-3">
          Thank you for paying your rent online. Your payment has been securely processed by Stripe and sent to your landlord.
        </p>
        {sessionId && (
          <p className="text-xs text-slate-400 mt-4">
            Reference ID: <span className="font-medium">{sessionId}</span>
          </p>
        )}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-slate-500">
            Need help? Reach out to your landlord or email support@landlordhub.com.
          </p>
          <Link
            href="/"
            className="inline-flex justify-center items-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Back to LandlordHub
          </Link>
        </div>
      </div>
    </div>
  )
}
