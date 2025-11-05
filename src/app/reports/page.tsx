'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, getExpenses, getMaintenanceTasks, getRentPayments } from '@/lib/database'
import { Property, Expense, MaintenanceTask, RentPayment } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import DateRangeFilter from '@/components/DateRangeFilter'
import { 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts'
import { Download, TrendingUp, DollarSign, FileDown, FileSpreadsheet, Home, PieChart as PieChartIcon, Share2, FileJson, AlertTriangle } from 'lucide-react'
import { generateTaxReportPDF } from '@/lib/pdfExport'

interface ProfitLossData {
  property: string
  monthlyRent: number
  totalExpenses: number
  netIncome: number
  roi: number
}

interface CategoryData {
  name: string
  value: number
  percentage: number
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
}

interface MonthlyNetIncomeData {
  month: string
  netIncome: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [pieChartDateRange, setPieChartDateRange] = useState<{ start: string; end: string } | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [fadeOnRange, setFadeOnRange] = useState(true)
  
  // Initialize date range to this month by default
  const getThisMonthRange = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    return {
      start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
      end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
    }
  }
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(getThisMonthRange())

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Fade transition when date range changes
  useEffect(() => {
    setFadeOnRange(false)
    const t = setTimeout(() => setFadeOnRange(true), 10)
    return () => clearTimeout(t)
  }, [dateRange, pieChartDateRange])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const loadData = async () => {
    try {
      const [propertiesData, expensesData, maintenanceData, paymentsData] = await Promise.all([
        getProperties(user!.id),
        getExpenses(user!.id),
        getMaintenanceTasks(user!.id),
        getRentPayments(user!.id).catch(() => []) // Load rent payments, but don't fail if table doesn't exist
      ])
      setProperties(propertiesData)
      setExpenses(expensesData)
      setMaintenanceTasks(maintenanceData)
      setRentPayments(paymentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredExpenses = () => {
    if (!dateRange) return expenses
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      return expenseDate >= startDate && expenseDate <= endDate
    })
  }

  const calculateProfitLoss = (): ProfitLossData[] => {
    const filteredExpenses = getFilteredExpenses()
    
    // Get current month and year for filtering paid rent
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    
    return properties.map(property => {
      const propertyExpenses = filteredExpenses.filter(expense => expense.property_id === property.id)
      const totalExpenses = propertyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      // Calculate actual paid rent for this property (all time or filtered period)
      // If date range is set, filter payments within range, otherwise use all paid payments
      let actualPaidRent = 0
      if (dateRange) {
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        
        actualPaidRent = rentPayments
          .filter(payment => 
            payment.property_id === property.id &&
            payment.status === 'paid'
          )
          .filter(payment => {
            // Create date from payment year and month
            const paymentDate = new Date(payment.year, payment.month - 1, 1)
            return paymentDate >= startDate && paymentDate <= endDate
          })
          .reduce((sum, payment) => sum + payment.amount, 0)
      } else {
        // If no date range, show all paid rent for this property
        actualPaidRent = rentPayments
          .filter(payment => 
            payment.property_id === property.id &&
            payment.status === 'paid'
          )
          .reduce((sum, payment) => sum + payment.amount, 0)
      }
      
      // Use actual paid rent if available, otherwise show $0
      const incomeAmount = actualPaidRent > 0 ? actualPaidRent : 0
      const netIncome = incomeAmount - totalExpenses
      const roi = property.monthly_rent > 0 ? (netIncome / property.monthly_rent) * 100 : 0
      
      return {
        property: property.address,
        monthlyRent: incomeAmount, // Show actual paid rent
        totalExpenses,
        netIncome,
        roi
      }
    }).sort((a, b) => b.netIncome - a.netIncome)
  }

  const getDateRangeOptions = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return {
      'This Month': {
        start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
      },
      'Last Month': {
        start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
      },
      'This Quarter': {
        start: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1).toISOString().split('T')[0],
        end: new Date(currentYear, Math.floor(currentMonth / 3) * 3 + 3, 0).toISOString().split('T')[0]
      },
      'This Year': {
        start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
        end: new Date(currentYear, 11, 31).toISOString().split('T')[0]
      },
      'Last Quarter': {
        start: new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 3, 1).toISOString().split('T')[0],
        end: new Date(currentYear, Math.floor(currentMonth / 3) * 3, 0).toISOString().split('T')[0]
      },
      'Last Year': {
        start: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
        end: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]
      }
    }
  }

  const handlePieChartDateRange = (rangeName: string | null) => {
    if (rangeName === null) {
      setPieChartDateRange(null)
      return
    }
    
    const options = getDateRangeOptions()
    const range = options[rangeName as keyof typeof options]
    if (range) {
      setPieChartDateRange(range)
    }
  }

  const getCurrentPieChartRangeLabel = () => {
    if (!pieChartDateRange) return 'All Time'
    
    const options = getDateRangeOptions()
    for (const [name, range] of Object.entries(options)) {
      if (range.start === pieChartDateRange.start && range.end === pieChartDateRange.end) {
        return name
      }
    }
    
    return `Custom: ${pieChartDateRange.start} to ${pieChartDateRange.end}`
  }

  const calculateCategoryData = (): CategoryData[] => {
    const categoryMap = new Map<string, number>()
    
    // Filter expenses by pie chart date range if set, otherwise use all expenses
    const filteredExpenses = pieChartDateRange 
      ? expenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          const startDate = new Date(pieChartDateRange.start)
          const endDate = new Date(pieChartDateRange.end)
          return expenseDate >= startDate && expenseDate <= endDate
        })
      : expenses
    
    filteredExpenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0
      categoryMap.set(expense.category, current + expense.amount)
    })
    
    const total = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0)
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value)
  }
  // Compute total using the pure calculator to avoid referring to variables declared later
  const totalCategoryAmount = useMemo(() => {
    const data = calculateCategoryData()
    return data.reduce((sum, c) => sum + c.value, 0)
  }, [expenses, pieChartDateRange])

  const calculateMonthlyData = (): MonthlyData[] => {
    // Use all expenses for monthly data, not filtered ones
    const allExpenses = expenses
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    
    // Initialize last 6 months including current month
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
      monthlyMap.set(monthKey, { income: 0, expenses: 0 })
    }
    
    // Add expenses
    allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      const monthKey = expenseDate.toISOString().slice(0, 7)
      const current = monthlyMap.get(monthKey)
      if (current) {
        current.expenses += expense.amount
      }
    })
    
    // Add income from actual rent payments that are marked as paid
    // Only count payments that have status === 'paid'
    const paidPayments = rentPayments.filter(payment => payment.status === 'paid')
    
    paidPayments.forEach(payment => {
      // Create month key from payment year and month (1-12)
      const monthKey = `${payment.year}-${String(payment.month).padStart(2, '0')}`
      const current = monthlyMap.get(monthKey)
      if (current) {
        current.income += payment.amount
      }
    })
    
    const result = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income: data.income,
      expenses: data.expenses
    }))
    
    return result
  }

  // Calculate monthly net income trend
  const calculateMonthlyNetIncomeTrend = (): MonthlyNetIncomeData[] => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    const now = new Date()
    
    // Initialize last 12 months including current month
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
      monthlyMap.set(monthKey, { income: 0, expenses: 0 })
    }
    
    // Add income from actual paid rent payments
    const paidPayments = rentPayments.filter(payment => payment.status === 'paid')
    paidPayments.forEach(payment => {
      const monthKey = `${payment.year}-${String(payment.month).padStart(2, '0')}`
      const current = monthlyMap.get(monthKey)
      if (current) {
        current.income += payment.amount
      }
    })
    
    // Add expenses by month
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      const monthKey = expenseDate.toISOString().slice(0, 7)
      const current = monthlyMap.get(monthKey)
      if (current) {
        current.expenses += expense.amount
      }
    })
    
    // Calculate net income for each month
    const result = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      netIncome: data.income - data.expenses
    }))
    
    return result
  }

  const calculateTaxSummary = () => {
    const filteredExpenses = getFilteredExpenses()
    
    // Calculate total income from actual paid rent payments
    // Sum all paid payments regardless of date for YTD calculation
    const totalIncome = rentPayments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0)
    
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netTaxableIncome = totalIncome - totalExpenses
    
    return {
      totalIncome,
      totalExpenses,
      netTaxableIncome
    }
  }

  const handleExportPDF = () => {
    const filteredExpenses = getFilteredExpenses()
    generateTaxReportPDF(
      {
        ...taxSummary,
        dateRange
      },
      profitLossData,
      properties,
      filteredExpenses,
      maintenanceTasks
    )
  }

  const exportCSV = (rows: ProfitLossData[]) => {
    const headers = ['Property','Monthly Rent','Total Expenses','Net Income','ROI %']
    const csvRows = [headers.join(',')]
    rows.forEach(r => {
      csvRows.push([
        '"' + r.property.replace(/"/g,'""') + '"',
        r.monthlyRent,
        r.totalExpenses,
        r.netIncome,
        r.roi.toFixed(2)
      ].join(','))
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'profit-loss.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Get consistent color for a category name
  const getCategoryColor = (categoryName: string): string => {
    // Predefined colors for common categories
    const categoryColorMap: Record<string, string> = {
      'Maintenance': '#3b82f6',      // Blue
      'Repairs': '#ef4444',           // Red
      'Utilities': '#10b981',        // Green
      'Insurance': '#f59e0b',         // Yellow/Orange
      'Property Tax': '#8b5cf6',     // Purple
      'Taxes': '#8b5cf6',            // Purple (alternative name)
      'HOA Fees': '#06b6d4',         // Cyan
      'Lawn Care': '#84cc16',        // Lime
      'Pest Control': '#f97316',    // Orange
      'Legal Fees': '#ec4899',       // Pink
      'Legal': '#ec4899',            // Pink (alternative name)
      'Marketing': '#14b8a6',        // Teal
      'Management Fees': '#6366f1',  // Indigo
      'Other': '#64748b'             // Gray
    }
    
    // If category has a predefined color, use it
    if (categoryColorMap[categoryName]) {
      return categoryColorMap[categoryName]
    }
    
    // For unknown categories, generate a consistent color using hash
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#64748b']
    let hash = 0
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  // Calculate chart data
  const profitLossData = calculateProfitLoss()
  const categoryData = calculateCategoryData()
  const monthlyData = calculateMonthlyData()
  const monthlyNetIncomeTrend = calculateMonthlyNetIncomeTrend()
  const taxSummary = calculateTaxSummary()
  
  // Derived KPI metrics
  const kpi = (() => {
    const trend = monthlyNetIncomeTrend
    const latest = trend[trend.length - 1]?.netIncome ?? 0
    const prev = trend[trend.length - 2]?.netIncome ?? 0
    const roiGrowthPercent = prev !== 0 ? ((latest - prev) / Math.abs(prev)) * 100 : 0
    const totalIncome = monthlyData.reduce((s, m) => s + (m.income || 0), 0)
    const totalExpenses = monthlyData.reduce((s, m) => s + (m.expenses || 0), 0)
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
    const topProperty = profitLossData[0]?.property || '—'
    const negativeMonths = monthlyNetIncomeTrend.filter(m => m.netIncome < 0).length
    const avgNetIncome = trend.length ? trend.reduce((s, m) => s + m.netIncome, 0) / trend.length : 0
    return { roiGrowthPercent, expenseRatio, topProperty, negativeMonths, avgNetIncome, latest, prev }
  })()

  // Compare: This Month vs Last Month (for caption and KPI context)
  const comparison = useMemo(() => {
    const now = new Date()
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
    const map = new Map<string, number>()
    monthlyNetIncomeTrend.forEach(m => {
      // m.month is like 'Nov 2025'
      const d = new Date(m.month)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, m.netIncome)
    })
    const thisVal = map.get(thisMonthKey) ?? 0
    const lastVal = map.get(lastMonthKey) ?? 0
    const delta = thisVal - lastVal
    const pct = lastVal !== 0 ? (delta / Math.abs(lastVal)) * 100 : 0
    return { thisVal, lastVal, delta, pct }
  }, [monthlyNetIncomeTrend])

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6" key={`reports-${Date.now()}`} style={{ background: '#F8FBFA' }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[22px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>
                <DollarSign className="w-5 h-5 text-[#1A5F7A]" /> Financial Reports
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: '#64748b' }}>
                Comprehensive financial analysis and reporting
              </p>
            </div>
          </div>

          {/* Forecast Widget */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>🎯 Projected Year-End Net Income</h2>
            </div>
            {(() => {
              const now = new Date()
              const year = now.getFullYear()
              // Build YTD net income from trend using actual months in current year
              const ytd = monthlyNetIncomeTrend.filter(m => {
                const d = new Date(m.month)
                return d.getFullYear() === year && d.getMonth() <= now.getMonth()
              })
              const ytdSum = ytd.reduce((s, m) => s + m.netIncome, 0)
              const monthsElapsed = now.getMonth() + 1
              const avg = monthsElapsed > 0 ? ytdSum / monthsElapsed : 0
              const remaining = 12 - monthsElapsed
              const projected = ytdSum + avg * remaining
              const target = Math.max(projected, 1) // avoid 0 target for gauge math
              const pct = Math.max(0, Math.min(100, (projected / target) * 100))
              const radius = 56
              const circumference = 2 * Math.PI * radius
              const dash = (pct / 100) * circumference
              return (
                <div className="flex items-center gap-6">
                  <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r={radius} stroke="#E5E7EB" strokeWidth="12" fill="none" />
                    <circle
                      cx="75" cy="75" r={radius}
                      stroke="#1A5F7A"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      transform="rotate(-90 75 75)"
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: '#1F2937' }}>
                      ${projected.toLocaleString()}
                    </text>
                  </svg>
                  <div>
                    <div className="text-[13px] text-gray-600">YTD Net Income</div>
                    <div className="text-[18px] font-semibold mb-2">${ytdSum.toLocaleString()}</div>
                    <div className="text-[13px] text-gray-600">Avg Monthly</div>
                    <div className="text-[18px] font-semibold">${avg.toLocaleString()}</div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ opacity: fadeOnRange ? 1 : 0, transition: 'opacity 200ms ease' }}>
            <div className="card p-4 flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[17px] font-bold" style={{ color: kpi.roiGrowthPercent >= 0 ? '#10B981' : '#EF4444' }}>
                  {kpi.roiGrowthPercent >= 0 ? '+' : '−'}{Math.abs(kpi.roiGrowthPercent).toFixed(0)}%
                </div>
                <div className="text-[13px] text-gray-600">ROI Growth vs last month</div>
              </div>
            </div>
            <div className="card p-4 flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,95,122,0.10)', color: '#1A5F7A' }}>
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[17px] font-bold" style={{ color: '#1F2937' }}>
                  {Math.round(kpi.expenseRatio)}%
                </div>
                <div className="text-[13px] text-gray-600">Expense Ratio</div>
              </div>
            </div>
            <div className="card p-4 flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,95,122,0.10)', color: '#1A5F7A' }}>
                <Home className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[15px] font-bold" style={{ color: '#0A2540' }}>
                  {kpi.topProperty}
                </div>
                <div className="text-[13px] text-gray-600">Top Performing Property</div>
              </div>
            </div>
            <div className="card p-4 flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[17px] font-bold" style={{ color: '#EF4444' }}>
                  {kpi.negativeMonths}
                </div>
                <div className="text-[13px] text-gray-600">Negative Months</div>
              </div>
            </div>
          </div>

          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            selectedRange={dateRange}
          />

          {/* Compare Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[13px] text-gray-700">
              <input type="checkbox" checked={compareEnabled} onChange={e => setCompareEnabled(e.target.checked)} />
              Compare This Month vs Last Month
            </label>
            {compareEnabled && (
              <div className="text-[13px]">
                {comparison.delta >= 0 ? (
                  <span className="text-green-600">+${Math.abs(comparison.delta).toLocaleString()} ({Math.abs(Math.round(comparison.pct))}%)</span>
                ) : (
                  <span className="text-red-600">−${Math.abs(comparison.delta).toLocaleString()} ({Math.abs(Math.round(comparison.pct))}%)</span>
                )}
              </div>
            )}
          </div>

          {/* Tax & Income Summary */}
          <div className="card p-6 section-mint">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>💰 Tax & Income Summary</h2>
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="px-4 py-2 rounded-full flex items-center gap-2 shadow-sm"
                  style={{ background: '#1A5F7A', color: 'white' }}
                >
                  <Download className="w-4 h-4" />
                  Export ▼
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border z-50" style={{ boxShadow: '0 10px 22px rgba(2,32,71,0.08)' }}>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <FileDown className="w-4 h-4 text-gray-600" /> PDF
                    </button>
                    <button onClick={() => exportCSV(profitLossData)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <FileSpreadsheet className="w-4 h-4 text-gray-600" /> CSV
                    </button>
                    <button onClick={() => alert('QuickBooks export coming soon')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <FileJson className="w-4 h-4 text-gray-600" /> QuickBooks
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <Share2 className="w-4 h-4 text-gray-600" /> Share Link
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="font-bold" style={{ color: '#0F3D3E', fontSize: '18px' }}>
                  ${taxSummary.totalIncome.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: '#64748b' }}>Total Income (YTD)</div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ color: '#E8684A', fontSize: '18px' }}>
                  ${taxSummary.totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: '#64748b' }}>Deductible Expenses (YTD)</div>
              </div>
              <div className="text-center">
                <div className="font-bold" style={{ fontSize: '18px', color: taxSummary.netTaxableIncome >= 0 ? '#10B981' : '#F87171', backgroundColor: taxSummary.netTaxableIncome >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.1)', display: 'inline-block', padding: '2px 8px', borderRadius: 8 }}>
                  ${taxSummary.netTaxableIncome.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: '#64748b' }}>Net Taxable Income</div>
              </div>
            </div>
          </div>

          {/* Property Performance */}
          <div className="card" style={{ opacity: fadeOnRange ? 1 : 0, transition: 'opacity 200ms ease' }}>
            <div className="p-6 border-b">
              <h2 className="text-[20px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>🏠 Property Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Rent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Expenses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Income</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROI %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profitLossData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50"
                      style={{ backgroundColor: index === 0 && row.netIncome > 0 ? 'rgba(16,185,129,0.06)' : 'transparent' }}
                      title={`${row.property} • Next rent due: ${properties.find(p => p.address === row.property)?.rent_due_date ? `day ${properties.find(p => p.address === row.property)?.rent_due_date}` : 'n/a'}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#0A2540' }}>{row.property}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#0A2540' }}>${row.monthlyRent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#E8684A' }}>${row.totalExpenses.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${row.netIncome >= 0 ? '' : ''}`} style={{ color: row.netIncome >= 0 ? '#10B981' : '#F87171' }}>
                        ${row.netIncome.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: row.roi >= 0 ? '#10B981' : '#F87171' }}>
                        {row.roi >= 0 ? '↑' : '↓'} {Math.abs(row.roi).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${profitLossData.reduce((sum, row) => sum + row.monthlyRent, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      ${profitLossData.reduce((sum, row) => sum + row.totalExpenses, 0).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 text-sm ${profitLossData.reduce((sum, row) => sum + row.netIncome, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profitLossData.reduce((sum, row) => sum + row.netIncome, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ opacity: fadeOnRange ? 1 : 0, transition: 'opacity 200ms ease' }}>
            {/* Expenses by Category Pie Chart */}
            <div className="card p-6 section-gray">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[20px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>📊 Expenses by Category</h2>
                <div className="text-sm text-gray-600">
                  Current: {getCurrentPieChartRangeLabel()}
                </div>
              </div>
              
              {/* Date Range Filter Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handlePieChartDateRange(null)}
                  className={`px-4 py-2 text-sm rounded-full border transition-all ${
                    !pieChartDateRange
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    background: !pieChartDateRange ? '#0F3D3E' : 'transparent',
                    borderColor: !pieChartDateRange ? '#0F3D3E' : '#E5E7EB',
                    boxShadow: !pieChartDateRange ? '0 6px 16px rgba(15,61,62,0.25)' : 'none'
                  }}
                >
                  All Time
                </button>
                {Object.keys(getDateRangeOptions()).map((range) => {
                  const options = getDateRangeOptions()
                  const rangeData = options[range as keyof typeof options]
                  const isActive = pieChartDateRange && 
                    pieChartDateRange.start === rangeData.start && 
                    pieChartDateRange.end === rangeData.end
                  
                  return (
                    <button
                      key={range}
                      onClick={() => handlePieChartDateRange(range)}
                      className={`px-4 py-2 text-sm rounded-full border transition-all ${
                        isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{
                        background: isActive ? '#0F3D3E' : 'transparent',
                        borderColor: isActive ? '#0F3D3E' : '#E5E7EB',
                        boxShadow: isActive ? '0 6px 16px rgba(15,61,62,0.25)' : 'none'
                      }}
                    >
                      {range}
                    </button>
                  )
                })}
              </div>
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%" key={`pie-chart-${Date.now()}`}>
                  <PieChart>
                    <defs>
                      <linearGradient id="gradTeal" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fde047" />
                      </linearGradient>
                      <linearGradient id="gradCoral" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="gradPurple" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={categoryData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="72%"
                      innerRadius="55%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => {
                        const fills = ['url(#gradTeal)','url(#gradGreen)','url(#gradYellow)','url(#gradCoral)','url(#gradPurple)']
                        return <Cell key={`cell-${index}`} fill={fills[index % fills.length]} />
                      })}
                    </Pie>
                    {/* Center total */}
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '16px', fill: '#0A2540', fontWeight: 700 }}>
                      Total: ${totalCategoryAmount.toLocaleString()}
                    </text>
                    <Tooltip formatter={(value, _name, { payload }) => {
                      const pct = payload?.percentage ? `${payload.percentage.toFixed(1)}%` : ''
                      return [
                        `$${Number(value).toLocaleString()} (${pct})`,
                        payload?.name || 'Amount'
                      ]
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Net Income Trend Chart */}
            <div className="card p-6 section-mint">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-[20px] font-bold flex items-center gap-2" style={{ color: '#0A2540' }}>📈 Monthly Net Income Trend</h2>
                {monthlyNetIncomeTrend.length >= 2 && (
                  <div className="text-[13px] text-gray-600">
                    {(() => {
                      const latest = kpi.latest
                      const prev = kpi.prev
                      const delta = latest - prev
                      const pct = prev !== 0 ? Math.round((delta / Math.abs(prev)) * 100) : 0
                      const isUp = delta >= 0
                      return (
                        <span className={isUp ? 'text-green-600' : 'text-red-600'}>
                          Net Income {isUp ? 'increased' : 'decreased'} {isUp ? '+' : '−'}{Math.abs(pct)}% since last month
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyNetIncomeTrend.map(d => ({ ...d, avg: kpi.avgNetIncome }))}>
                    <defs>
                      <linearGradient id="colorNetIncomePositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNetIncomeNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Income']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    {/* Positive area */}
                    <Area
                      type="monotone"
                      dataKey="netIncome"
                      stroke="#1A5F7A"
                      fillOpacity={1}
                      fill="rgba(26, 95, 122, 0.10)"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, index } = props
                        const isLatest = index === monthlyNetIncomeTrend.length - 1
                        if (!isLatest) return <circle cx={cx} cy={cy} r={3} fill="#1A5F7A" />
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={6} fill="#1A5F7A" />
                            <circle cx={cx} cy={cy} r={10} fill="rgba(26,95,122,0.3)" />
                          </g>
                        )
                      }}
                    />
                    {/* Average line */}
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#9ca3af"
                      strokeWidth={1.5}
                      strokeDasharray="6 6"
                      dot={false}
                      name="Average"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Summary Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {(() => {
                    const totalNetIncome = monthlyNetIncomeTrend.reduce((sum, m) => sum + m.netIncome, 0)
                    const averageNetIncome = monthlyNetIncomeTrend.length > 0 ? totalNetIncome / monthlyNetIncomeTrend.length : 0
                    const negativeMonths = monthlyNetIncomeTrend.filter(m => m.netIncome < 0).length
                    
                    return (
                      <>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Total Net Income</p>
                          <p className={`text-lg font-semibold ${totalNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${totalNetIncome.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Average Monthly</p>
                          <p className={`text-lg font-semibold ${averageNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${averageNetIncome.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Negative Months</p>
                          <p className={`text-lg font-semibold ${negativeMonths === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {negativeMonths}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
