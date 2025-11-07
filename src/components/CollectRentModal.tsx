"use client"

import { useEffect, useMemo, useState } from 'react'
import { Property } from '@/lib/types'
import { X, Loader2, Copy, ExternalLink, Calendar, Repeat, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

export interface CollectRentFormValues {
  amount: number
  currency: string
  dueDate?: string
  description?: string
  tenantEmail: string
  tenantPhone?: string
  isRecurring: boolean
}

interface CollectRentModalProps {
  open: boolean
  property: Property | null
  onClose: () => void
  onSubmit: (values: CollectRentFormValues) => Promise<{ checkoutUrl: string }>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value || 0)

export default function CollectRentModal({ open, property, onClose, onSubmit }: CollectRentModalProps) {
  const [form, setForm] = useState<CollectRentFormValues>({
    amount: 0,
    currency: 'usd',
    dueDate: undefined,
    description: '',
    tenantEmail: '',
    tenantPhone: '',
    isRecurring: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const defaultDueDate = useMemo(() => {
    if (!property) return undefined
    const today = new Date()
    if (property.rent_due_date) {
      const due = new Date(today.getFullYear(), today.getMonth(), property.rent_due_date)
      if (due.getTime() < today.getTime()) {
        due.setMonth(due.getMonth() + 1)
      }
      return due.toISOString().split('T')[0]
    }
    return today.toISOString().split('T')[0]
  }, [property])

  useEffect(() => {
    if (property && open) {
      setForm({
        amount: property.monthly_rent || 0,
        currency: 'usd',
        dueDate: defaultDueDate,
        description: '',
        tenantEmail: property.tenant_email || '',
        tenantPhone: property.tenant_phone || '',
        isRecurring: false,
      })
      setCheckoutUrl(null)
      setError(null)
    }
  }, [property, open, defaultDueDate])

  if (!open || !property) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.tenantEmail) {
      setError('Tenant email is required to send the payment link.')
      return
    }
    if (!form.amount || form.amount <= 0) {
      setError('Amount must be greater than 0.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await onSubmit(form)
      setCheckoutUrl(result.checkoutUrl)
      toast.success('Rent checkout link created')
    } catch (submissionError: any) {
      const message = submissionError?.message || 'Failed to create rent checkout session.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!checkoutUrl) return
    try {
      await navigator.clipboard.writeText(checkoutUrl)
      toast.success('Link copied to clipboard')
    } catch (copyError) {
      console.error('Failed to copy link', copyError)
      toast.error('Unable to copy link. Please copy it manually.')
    }
  }

  const marketingCopy = 'Tenants can pay online via our secure Stripe-powered checkout. Funds go directly to your bank.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Collect Rent Online</h2>
            <p className="text-sm text-slate-500 mt-1">{marketingCopy}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close collect rent modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Property</p>
              <p className="text-base font-medium text-slate-900">
                {property.nickname || property.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Monthly Rent</p>
              <p className="text-base font-semibold text-emerald-600">{formatCurrency(property.monthly_rent)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rent-amount">Amount to Collect</label>
              <input
                id="rent-amount"
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="1500"
              />
              <p className="text-xs text-slate-500">Defaulted to monthly rent. Adjust if collecting partial or past-due amounts.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rent-due-date">Due Date (optional)</label>
              <div className="relative">
                <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="rent-due-date"
                  type="date"
                  value={form.dueDate || ''}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-500">Used for reminders and your dashboard records.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rent-tenant-email">Tenant Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="rent-tenant-email"
                  type="email"
                  value={form.tenantEmail}
                  onChange={(event) => setForm({ ...form, tenantEmail: event.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="tenant@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rent-tenant-phone">Tenant Phone (optional)</label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="rent-tenant-phone"
                  type="tel"
                  value={form.tenantPhone || ''}
                  onChange={(event) => setForm({ ...form, tenantPhone: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rent-description">Notes to tenant (optional)</label>
              <textarea
                id="rent-description"
                value={form.description || ''}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Include reminders like late fees, preferred payment timing, or lease notes."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(event) => setForm({ ...form, isRecurring: event.target.checked })}
                className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                  <Repeat className="h-4 w-4" />
                  Offer automatic monthly payments (Stripe Billing)
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Stripe will let the tenant opt-in to recurring payments during checkout.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <div className="text-sm text-slate-500">
              Stripe hosts the checkout. You’ll see live status updates in your LandlordHub dashboard.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  'Generate Checkout Link'
                )}
              </button>
            </div>
          </div>
        </form>

        {checkoutUrl && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Checkout link ready to share</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-600 break-all bg-white border border-slate-200 rounded-lg px-3 py-2">
                {checkoutUrl}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </button>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View checkout
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
