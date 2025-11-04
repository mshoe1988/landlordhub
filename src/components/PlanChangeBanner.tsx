'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PlanChangeBanner() {
  const [show, setShow] = useState(false)

  const checkPlanChange = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/get-subscription?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store'
      })
      const data = await res.json()
      const currentPlan: string = data?.subscription?.plan || 'free'
      const lastPlan = typeof window !== 'undefined' ? localStorage.getItem('lh_last_plan') : null

      // If there's a stored plan and it's different, show banner
      if (lastPlan && lastPlan !== currentPlan) {
        setShow(true)
      }

      // Always store the latest plan for next comparisons
      if (typeof window !== 'undefined') {
        localStorage.setItem('lh_latest_plan_seen', currentPlan)
      }
    } catch (e) {
      // no-op
    }
  }

  useEffect(() => {
    checkPlanChange()

    const onFocus = () => checkPlanChange()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] shadow-lg">
      <div className="rounded-lg bg-blue-600 text-white p-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Subscription updated</div>
          <div className="text-sm opacity-90">Your plan has changed. View your updated account.</div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/account"
            className="px-3 py-1.5 rounded-md bg-white text-blue-700 font-medium hover:bg-blue-50"
            onClick={() => setShow(false)}
          >
            View account
          </a>
          <button
            aria-label="Dismiss"
            className="px-2 py-1 rounded-md border border-white/30 hover:bg-white/10"
            onClick={() => setShow(false)}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}








