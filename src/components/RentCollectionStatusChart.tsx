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
  status: 'Paid' | 'Pending' | 'Late'
  count: number
  percentage: number
  tenants: Array<{ property: string; tenant: string; amount: number }>
  color: string
}

export default function RentCollectionStatusChart({ properties, rentPayments }: RentCollectionStatusChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<'Paid' | 'Pending' | 'Late' | null>(null)
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
        { status: 'Pending', count: 0, percentage: 0, tenants: [], color: '#f59e0b' },
        { status: 'Late', count: 0, percentage: 0, tenants: [], color: '#ef4444' }
      ]
    }

    const paid: Array<{ property: string; tenant: string; amount: number }> = []
    const pending: Array<{ property: string; tenant: string; amount: number }> = []
    const late: Array<{ property: string; tenant: string; amount: number }> = []

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
          late.push(tenantInfo)
        } else {
          pending.push(tenantInfo)
        }
      }
    })

    const total = propertiesWithTenants.length
    const paidCount = paid.length
    const pendingCount = pending.length
    const lateCount = late.length

    return [
      { 
        status: 'Paid', 
        count: paidCount, 
        percentage: total > 0 ? Math.round((paidCount / total) * 100) : 0, 
        tenants: paid,
        color: '#10b981' 
      },
      { 
        status: 'Pending', 
        count: pendingCount, 
        percentage: total > 0 ? Math.round((pendingCount / total) * 100) : 0, 
        tenants: pending,
        color: '#f59e0b' 
      },
      { 
        status: 'Late', 
        count: lateCount, 
        percentage: total > 0 ? Math.round((lateCount / total) * 100) : 0, 
        tenants: late,
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">Rent Collection Status</h2>
        </div>
        <div className="flex gap-2 items-center">
          {/* Month/Year Selector */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value))
                setSelectedSegment(null) // Clear selection when changing month
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value))
                setSelectedSegment(null) // Clear selection when changing year
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
            >
              {getYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {/* Chart Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('donut')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                chartType === 'donut'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Donut
            </button>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{monthName}</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statusData.map((status) => (
          <div
            key={status.status}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedSegment === status.status
                ? 'border-gray-800 shadow-lg'
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
            <div className="flex items-center gap-2 mb-2">
              {status.status === 'Paid' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {status.status === 'Pending' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
              {status.status === 'Late' && <XCircle className="h-5 w-5 text-red-600" />}
              <span className="font-semibold text-gray-800">{status.status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: status.color }}>
              {status.count}
            </div>
            <div className="text-sm text-gray-600">
              {status.percentage}% • {status.count}/{totalUnits} units
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={statusData as any}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                onClick={handleBarClick}
                cursor="pointer"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={statusData as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }: any) => `${status}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                onClick={(data: any, index: number) => handlePieClick(data, index)}
                cursor="pointer"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
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

