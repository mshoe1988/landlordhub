'use client'

import { useState } from 'react'
import { markRentAsPaid, markRentAsUnpaid, getRentPayment } from '@/lib/database'
import { RentPayment, Property } from '@/lib/types'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface RentPaymentStatusProps {
  property: Property
  userId: string
  currentPayment?: RentPayment | null
  onPaymentUpdate?: () => void
}

export default function RentPaymentStatus({
  property,
  userId,
  currentPayment,
  onPaymentUpdate
}: RentPaymentStatusProps) {
  const [updating, setUpdating] = useState(false)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const isPaid = currentPayment?.status === 'paid'
  const isPartial = currentPayment?.status === 'partial'
  const isOverdue = !isPaid && !isPartial && property.rent_due_date && now.getDate() > property.rent_due_date

  const handleTogglePayment = async () => {
    setUpdating(true)
    try {
      if (isPaid) {
        await markRentAsUnpaid(userId, property.id, currentMonth, currentYear)
      } else {
        await markRentAsPaid(userId, property.id, currentMonth, currentYear, property.monthly_rent)
      }
      onPaymentUpdate?.()
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = () => {
    if (isPaid) return 'text-green-600 bg-green-50'
    if (isPartial) return 'text-yellow-600 bg-yellow-50'
    if (isOverdue) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getStatusText = () => {
    if (isPaid) return 'Paid'
    if (isPartial) return 'Partial'
    if (isOverdue) return 'Overdue'
    return 'Unpaid'
  }

  if (!property.tenant_name) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">No tenant</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${getStatusColor()}`}>
        {isPaid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span>{getStatusText()}</span>
        {currentPayment?.payment_date && (
          <span className="text-xs opacity-75 ml-1">
            ({currentPayment.payment_date})
          </span>
        )}
      </div>
      <button
        onClick={handleTogglePayment}
        disabled={updating}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-colors
          ${isPaid
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-1.5
        `}
        title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
      >
        {updating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
          </>
        )}
      </button>
    </div>
  )
}

