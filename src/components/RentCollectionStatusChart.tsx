'use client'

import { useState } from 'react'
import { Property, RentPayment } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface RentCollectionStatusChartProps {
  properties: Property[]
  rentPayments: RentPayment[]
}

interface CollectionStatusData {
  status: 'Paid' | 'Unpaid' | 'Overdue'
  count: number
  percentage: number
  tenants: Array<{ property: string; tenant: string; amount: number }>
  color: string
}

export default function RentCollectionStatusChart({ properties, rentPayments }: RentCollectionStatusChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<'Paid' | 'Unpaid' | 'Overdue' | null>(null)
  const [chartType, setChartType] = useState<'bar' | 'donut'>('donut')
  
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Calculate collection status
  const calculateCollectionStatus = (): CollectionStatusData[] => {
    const propertiesWithTenants = properties.filter(p => p.tenant_name)
    
    if (propertiesWithTenants.length === 0) {
      return [
        { status: 'Paid', count: 0, percentage: 0, tenants: [], color: '#10b981' },
        { status: 'Unpaid', count: 0, percentage: 0, tenants: [], color: '#f59e0b' },
        { status: 'Overdue', count: 0, percentage: 0, tenants: [], color: '#ef4444' }
      ]
    }

    const paid: Array<{ property: string; tenant: string; amount: number }> = []
    const unpaid: Array<{ property: string; tenant: string; amount: number }> = []
    const overdue: Array<{ property: string; tenant: string; amount: number }> = []

    // Determine if the selected month is in the past or future for "Late" calculation
    const isSelectedMonthPast = selectedYear < now.getFullYear() || 
      (selectedYear === now.getFullYear() && selectedMonth < now.getMonth() + 1)
    const isSelectedMonthCurrent = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
    const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1)

    propertiesWithTenants.forEach(property => {
      const payment = rentPayments.find(
        p => p.property_id === property.id && 
        p.month === selectedMonth && 
        p.year === selectedYear
      )

      const tenantInfo = {
        property: property.address,
        tenant: property.tenant_name || 'Unknown',
        amount: payment?.amount || property.monthly_rent
      }

      if (payment?.status === 'paid') {
        paid.push(tenantInfo)
      } else {
        // Check if late
        // For current or past months: check if past due date
        // For future months: everything is pending
        let isLate = false
        if (isSelectedMonthPast || isSelectedMonthCurrent) {
          // For past months, check if past due date in that month
          const dueDateInSelectedMonth = property.rent_due_date || 1
          const lastDayOfSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate()
          const dueDateToCheck = Math.min(dueDateInSelectedMonth, lastDayOfSelectedMonth)
          
          if (isSelectedMonthPast) {
            // Past month: if no payment, it's late
            isLate = true
          } else if (isSelectedMonthCurrent) {
            // Current month: check if today is past due date
            isLate = property.rent_due_date ? now.getDate() > property.rent_due_date : false
          }
        }
        
        if (isLate) {
          overdue.push(tenantInfo)
        } else {
          unpaid.push(tenantInfo)
        }
      }
    })

    const total = propertiesWithTenants.length
    const paidCount = paid.length
    const unpaidCount = unpaid.length
    const overdueCount = overdue.length

    return [
      { 
        status: 'Paid', 
        count: paidCount, 
        percentage: total > 0 ? Math.round((paidCount / total) * 100) : 0, 
        tenants: paid,
        color: '#10b981' 
      },
      { 
        status: 'Unpaid', 
        count: unpaidCount, 
        percentage: total > 0 ? Math.round((unpaidCount / total) * 100) : 0, 
        tenants: unpaid,
        color: '#f59e0b' 
      },
      { 
        status: 'Overdue', 
        count: overdueCount, 
        percentage: total > 0 ? Math.round((overdueCount / total) * 100) : 0, 
        tenants: overdue,
        color: '#ef4444' 
      }
    ]
  }

  const statusData = calculateCollectionStatus()

  const handleBarClick = (data: any) => {
    const status = data?.activePayload?.[0]?.payload?.status || data?.status
    if (selectedSegment === status) {
      setSelectedSegment(null)
    } else {
      setSelectedSegment(status)
    }
  }

  const handlePieClick = (data: any, index: number) => {
    const status = data?.status || statusData[index]?.status
    if (selectedSegment === status) {
      setSelectedSegment(null)
    } else {
      setSelectedSegment(status)
    }
  }

  const selectedStatusData = selectedSegment 
    ? statusData.find(s => s.status === selectedSegment)
    : null

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.status}</p>
          <p className="text-sm text-gray-600">Units: {data.count}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.status}</p>
          <p className="text-sm text-gray-600">Units: {data.count}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  const totalUnits = statusData.reduce((sum, s) => sum + s.count, 0)
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Generate year options (current year - 2 to current year + 1)
  const getYearOptions = () => {
    const years = []
    const currentYear = now.getFullYear()
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i)
    }
    return years
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: '#E5E9E7', borderBottomWidth: '1px' }}>
        <div className="flex-1">
          <h2 style={{ color: '#0A2540', fontWeight: 600, fontSize: '1.1rem' }}>Rent Collection Status</h2>
          <p className="text-sm mt-1" style={{ color: '#7A8A8A' }}>{monthName}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Month/Year Selector */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value))
                setSelectedSegment(null) // Clear selection when changing month
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>{name.substring(0, 3)}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value))
                setSelectedSegment(null) // Clear selection when changing year
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {getYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-4" style={{ backgroundColor: '#F7FBF9' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {statusData.map((entry, index) => {
                // Gradient colors for pie chart slices
                const gradientColors: Record<string, { from: string; to: string }> = {
                  '#10b981': { from: '#1C7C63', to: '#29A184' }, // Green -> Teal
                  '#f59e0b': { from: '#F7A43F', to: '#FCD07D' }, // Orange gradient
                  '#ef4444': { from: '#E45B56', to: '#F19C98' }  // Red gradient
                }
                const colorGradient = gradientColors[entry.color] || { from: entry.color, to: entry.color }
                return (
                  <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorGradient.from} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={colorGradient.to} stopOpacity={0.6} />
                  </linearGradient>
                )
              })}
            </defs>
            <Pie
              data={statusData as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, percentage }: any) => `${percentage}%`}
              outerRadius={80}
              innerRadius={20}
              fill="#8884d8"
              dataKey="count"
              onClick={(data: any, index: number) => handlePieClick(data, index)}
              cursor="pointer"
            >
              {statusData.map((entry, index) => {
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#pieGradient-${index})`}
                    style={{
                      cursor: 'pointer',
                      opacity: selectedSegment === entry.status ? 1 : 0.9,
                      transition: 'opacity 0.2s ease'
                    }}
                  />
                )
              })}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="flex justify-center gap-4 mb-4">
        {statusData.map((status) => (
          <div
            key={status.status}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
              selectedSegment === status.status
                ? 'border-gray-800 shadow-lg bg-gray-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            onClick={() => {
              if (selectedSegment === status.status) {
                setSelectedSegment(null)
              } else {
                setSelectedSegment(status.status)
              }
            }}
          >
            {status.status === 'Paid' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {status.status === 'Unpaid' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
            {status.status === 'Overdue' && <XCircle className="h-4 w-4 text-red-600" />}
            <span className="text-sm font-semibold text-gray-800">{status.status}</span>
            <span className="text-sm text-gray-600">({status.count})</span>
          </div>
        ))}
      </div>

      {/* Tenant List */}
      {selectedStatusData && selectedStatusData.tenants.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedStatusData.status} Tenants ({selectedStatusData.tenants.length})
          </h3>
          <div className="space-y-3">
            {selectedStatusData.tenants.map((tenant, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{tenant.tenant}</p>
                  <p className="text-sm text-gray-600">{tenant.property}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">${tenant.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStatusData && selectedStatusData.tenants.length === 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="text-gray-600 text-center py-4">
            No {selectedStatusData.status.toLowerCase()} tenants for {monthName}
          </p>
        </div>
      )}
    </div>
  )
}

