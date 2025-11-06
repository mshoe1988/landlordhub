'use client'

import { useState, useEffect } from 'react'
import { markRentAsPaid, markRentAsUnpaid, getRentPayment, markMultipleMonthsAsPaid } from '@/lib/database'
import { RentPayment, Property } from '@/lib/types'
import { CheckCircle2, XCircle, Loader2, Calendar, Settings } from 'lucide-react'

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
  const [showProratedModal, setShowProratedModal] = useState(false)
  const [bulkStartMonth, setBulkStartMonth] = useState(currentMonth)
  const [bulkStartYear, setBulkStartYear] = useState(currentYear)
  const [bulkEndMonth, setBulkEndMonth] = useState(currentMonth)
  const [bulkEndYear, setBulkEndYear] = useState(currentYear)
  const [processingBulk, setProcessingBulk] = useState(false)
  const [proratedMoveInDate, setProratedMoveInDate] = useState('')
  const [proratedMoveOutDate, setProratedMoveOutDate] = useState('')
  const [proratedDays, setProratedDays] = useState('')
  const [proratedAmount, setProratedAmount] = useState('')
  const [processingProrated, setProcessingProrated] = useState(false)

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

  // Calculate prorated rent based on move-in or move-out date
  const calculateProratedRent = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    let daysCovered = daysInMonth

    if (proratedMoveInDate) {
      // Move-in mid-month: calculate days from move-in to end of month
      const moveIn = new Date(proratedMoveInDate)
      if (moveIn.getMonth() + 1 === currentMonth && moveIn.getFullYear() === currentYear) {
        daysCovered = daysInMonth - moveIn.getDate() + 1 // Include move-in day
      }
    } else if (proratedMoveOutDate) {
      // Move-out mid-month: calculate days from start of month to move-out
      const moveOut = new Date(proratedMoveOutDate)
      if (moveOut.getMonth() + 1 === currentMonth && moveOut.getFullYear() === currentYear) {
        daysCovered = moveOut.getDate() // Days from 1st to move-out date (inclusive)
      }
    } else if (proratedDays) {
      // Manual days entry
      daysCovered = parseInt(proratedDays)
    }

    // Calculate prorated amount: (monthly_rent / days_in_month) * days_covered
    const dailyRate = property.monthly_rent / daysInMonth
    const amount = dailyRate * daysCovered
    return { daysCovered, amount: Math.round(amount * 100) / 100 } // Round to 2 decimal places
  }

  const handleProratedPayment = async () => {
    const { daysCovered, amount } = calculateProratedRent()

    if (daysCovered <= 0 || daysCovered > 31) {
      alert('Please enter valid days covered (1-31)')
      return
    }

    if (amount <= 0) {
      alert('Calculated amount must be greater than 0')
      return
    }

    setProcessingProrated(true)
    try {
      await markRentAsPaid(
        userId,
        property.id,
        currentMonth,
        currentYear,
        amount,
        new Date().toISOString().split('T')[0],
        `Prorated rent for ${daysCovered} days${proratedMoveInDate ? ` (moved in ${proratedMoveInDate})` : ''}${proratedMoveOutDate ? ` (moved out ${proratedMoveOutDate})` : ''}`,
        daysCovered,
        proratedMoveInDate || undefined,
        proratedMoveOutDate || undefined
      )
      setShowProratedModal(false)
      setProratedMoveInDate('')
      setProratedMoveOutDate('')
      setProratedDays('')
      setProratedAmount('')
      onPaymentUpdate?.()
    } catch (error) {
      console.error('Error processing prorated payment:', error)
      alert('Failed to process prorated payment')
    } finally {
      setProcessingProrated(false)
    }
  }

  // Update prorated amount when dates or days change
  useEffect(() => {
    if (proratedMoveInDate || proratedMoveOutDate || proratedDays) {
      const { daysCovered, amount } = calculateProratedRent()
      setProratedAmount(amount.toFixed(2))
    }
  }, [proratedMoveInDate, proratedMoveOutDate, proratedDays, currentMonth, currentYear, property.monthly_rent])

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleTogglePayment}
          disabled={updating}
          className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: isPaid ? '#F3F4F6' : '#DFF7E4',
            color: isPaid ? '#6B7280' : '#1C7C63',
            borderRadius: '20px',
            fontWeight: 500,
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!updating) {
              e.currentTarget.style.backgroundColor = isPaid ? '#E5E7EB' : '#C6F6D5'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isPaid ? '#F3F4F6' : '#DFF7E4'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              {isPaid ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{isPaid ? 'Mark Unpaid' : 'Mark Paid'}</span>
            </>
          )}
        </button>
        <button
          onClick={() => setShowBulkPaymentModal(true)}
          disabled={updating}
          className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: '#E0E7FF',
            color: '#4F46E5',
            borderRadius: '20px',
            fontWeight: 500,
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!updating) {
              e.currentTarget.style.backgroundColor = '#C7D2FE'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E0E7FF'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Pay multiple months at once"
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>Pay Multiple</span>
        </button>
        <button
          onClick={() => setShowProratedModal(true)}
          disabled={updating}
          className="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: '#EEEAFB',
            color: '#6B4AE2',
            borderRadius: '20px',
            fontWeight: 500,
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!updating) {
              e.currentTarget.style.backgroundColor = '#DDD6FE'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#EEEAFB'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Record prorated rent (move-in/out mid-month)"
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span>Prorated</span>
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

      {/* Prorated Payment Modal */}
      {showProratedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto" style={{ paddingTop: '1rem' }}>
          <div className="bg-white rounded-lg max-w-md w-full mx-4 mb-4 flex flex-col shadow-xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="p-6 flex-shrink-0 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Record Prorated Rent</h3>
              <p className="text-sm text-gray-600">
                For {monthNames[currentMonth - 1]} {currentYear} • Monthly Rent: ${property.monthly_rent.toLocaleString()}
              </p>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 min-h-0">
              <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-In Date (optional)
                </label>
                <input
                  type="date"
                  value={proratedMoveInDate}
                  onChange={(e) => {
                    setProratedMoveInDate(e.target.value)
                    setProratedMoveOutDate('') // Clear move-out if move-in is set
                    setProratedDays('') // Clear manual days entry
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  max={`${currentYear}-${String(currentMonth).padStart(2, '0')}-31`}
                  min={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tenant moved in mid-month (calculates from move-in to end of month)
                </p>
              </div>

              <div className="text-center text-sm text-gray-500">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-Out Date (optional)
                </label>
                <input
                  type="date"
                  value={proratedMoveOutDate}
                  onChange={(e) => {
                    setProratedMoveOutDate(e.target.value)
                    setProratedMoveInDate('') // Clear move-in if move-out is set
                    setProratedDays('') // Clear manual days entry
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  max={`${currentYear}-${String(currentMonth).padStart(2, '0')}-31`}
                  min={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tenant moved out mid-month (calculates from start of month to move-out)
                </p>
              </div>

              <div className="text-center text-sm text-gray-500">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Covered (manual entry)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={proratedDays}
                  onChange={(e) => {
                    setProratedDays(e.target.value)
                    setProratedMoveInDate('')
                    setProratedMoveOutDate('')
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  placeholder="Enter days covered (1-31)"
                />
              </div>

              <div className="bg-purple-50 rounded p-4 border border-purple-200">
                <div className="text-sm text-gray-700 mb-2">
                  <div className="font-medium">Calculation:</div>
                  {proratedDays || proratedMoveInDate || proratedMoveOutDate ? (
                    <>
                      <div className="mt-1">
                        Days Covered: {calculateProratedRent().daysCovered}
                      </div>
                      <div className="mt-1">
                        Daily Rate: ${(property.monthly_rent / new Date(currentYear, currentMonth, 0).getDate()).toFixed(2)}
                      </div>
                      <div className="font-semibold text-purple-800 mt-2 text-base">
                        Prorated Amount: ${calculateProratedRent().amount.toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">Enter move-in date, move-out date, or days covered to calculate</div>
                  )}
                </div>
              </div>
            </div>
            </div>

            <div className="p-6 flex-shrink-0 border-t border-gray-200 bg-white flex gap-3">
              <button
                onClick={handleProratedPayment}
                disabled={processingProrated || (!proratedMoveInDate && !proratedMoveOutDate && !proratedDays)}
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {processingProrated ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Mark as Paid'
                )}
              </button>
              <button
                onClick={() => {
                  setShowProratedModal(false)
                  setProratedMoveInDate('')
                  setProratedMoveOutDate('')
                  setProratedDays('')
                  setProratedAmount('')
                }}
                disabled={processingProrated}
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

