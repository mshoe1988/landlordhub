'use client'

import { useState } from 'react'
import { markRentAsPaid, markRentAsUnpaid, getRentPayment, markMultipleMonthsAsPaid } from '@/lib/database'
import { RentPayment, Property } from '@/lib/types'
import { CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react'

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
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const [updating, setUpdating] = useState(false)
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false)
  const [bulkStartMonth, setBulkStartMonth] = useState(currentMonth)
  const [bulkStartYear, setBulkStartYear] = useState(currentYear)
  const [bulkEndMonth, setBulkEndMonth] = useState(currentMonth)
  const [bulkEndYear, setBulkEndYear] = useState(currentYear)
  const [processingBulk, setProcessingBulk] = useState(false)

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

  const handleBulkPayment = async () => {
    // Generate months array from start to end
    const months: Array<{ month: number; year: number }> = []
    let current = new Date(bulkStartYear, bulkStartMonth - 1, 1)
    const end = new Date(bulkEndYear, bulkEndMonth - 1, 1)

    while (current <= end) {
      months.push({
        month: current.getMonth() + 1,
        year: current.getFullYear()
      })
      current.setMonth(current.getMonth() + 1)
    }

    if (months.length === 0) {
      alert('Please select a valid date range')
      return
    }

    setProcessingBulk(true)
    try {
      await markMultipleMonthsAsPaid(
        userId,
        property.id,
        months,
        property.monthly_rent,
        new Date().toISOString().split('T')[0],
        `Bulk payment for ${months.length} month(s)`
      )
      setShowBulkPaymentModal(false)
      onPaymentUpdate?.()
    } catch (error) {
      console.error('Error processing bulk payment:', error)
      alert('Failed to process bulk payment')
    } finally {
      setProcessingBulk(false)
    }
  }

  // Generate year options (current year and next 2 years)
  const getYearOptions = () => {
    const years = []
    for (let i = 0; i < 3; i++) {
      years.push(currentYear + i)
    }
    return years
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

  // Calculate total for bulk payment
  const calculateBulkTotal = () => {
    let current = new Date(bulkStartYear, bulkStartMonth - 1, 1)
    const end = new Date(bulkEndYear, bulkEndMonth - 1, 1)
    let monthsCount = 0

    while (current <= end) {
      monthsCount++
      current.setMonth(current.getMonth() + 1)
    }

    return monthsCount * property.monthly_rent
  }

  return (
    <>
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
        <button
          onClick={() => setShowBulkPaymentModal(true)}
          disabled={updating}
          className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          title="Pay multiple months at once"
        >
          <Calendar className="h-3.5 w-3.5" />
          Pay Multiple
        </button>
      </div>

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Pay Multiple Months</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Month
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bulkStartMonth}
                    onChange={(e) => setBulkStartMonth(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={bulkStartYear}
                    onChange={(e) => setBulkStartYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Month
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bulkEndMonth}
                    onChange={(e) => setBulkEndMonth(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={bulkEndYear}
                    onChange={(e) => setBulkEndYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-600">
                  <div>Monthly Rent: ${property.monthly_rent.toLocaleString()}</div>
                  <div className="font-semibold text-gray-800 mt-1">
                    Total: ${calculateBulkTotal().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkPayment}
                disabled={processingBulk}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Mark as Paid'
                )}
              </button>
              <button
                onClick={() => setShowBulkPaymentModal(false)}
                disabled={processingBulk}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

