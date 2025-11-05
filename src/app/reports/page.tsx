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
import { Download, TrendingUp, TrendingDown, DollarSign, FileDown, FileSpreadsheet, Home, ArrowUpRight, TrendingUp as TrendingUpIcon } from 'lucide-react'
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
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)

  // Initialize date range on client side only to avoid hydration mismatch
  useEffect(() => {
    setDateRange(getThisMonthRange())
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

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

  // Get consistent pastel color for a category name
  const getCategoryColor = (categoryName: string): string => {
    // Predefined pastel colors for common categories
    const categoryColorMap: Record<string, string> = {
      'Maintenance': '#A5D8FF',      // Pastel Blue
      'Repairs': '#FFB3BA',           // Pastel Red
      'Utilities': '#BAFFC9',        // Pastel Green
      'Insurance': '#FFDFBA',         // Pastel Orange
      'Property Tax': '#E0BBE4',     // Pastel Purple
      'Taxes': '#E0BBE4',            // Pastel Purple (alternative name)
      'HOA Fees': '#B4E6FF',         // Pastel Cyan
      'Lawn Care': '#D4F4B7',        // Pastel Lime
      'Pest Control': '#FFCCB6',    // Pastel Peach
      'Legal Fees': '#FFC1E3',       // Pastel Pink
      'Legal': '#FFC1E3',            // Pastel Pink (alternative name)
      'Marketing': '#B3E5D1',        // Pastel Teal
      'Management Fees': '#C5C7F0',  // Pastel Indigo
      'Other': '#D1D5DB'             // Pastel Gray
    }
    
    // If category has a predefined color, use it
    if (categoryColorMap[categoryName]) {
      return categoryColorMap[categoryName]
    }
    
    // For unknown categories, generate a consistent pastel color using hash
    const colors = ['#A5D8FF', '#FFB3BA', '#BAFFC9', '#FFDFBA', '#E0BBE4', '#B4E6FF', '#D4F4B7', '#FFCCB6', '#FFC1E3', '#B3E5D1', '#C5C7F0', '#D1D5DB']
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

  // Calculate KPI metrics (client-side only to avoid hydration mismatch)
  const [kpiMetrics, setKpiMetrics] = useState({
    roiGrowth: 0,
    expenseRatio: 0,
    topProperty: '—',
    projectedYearEnd: 0
  })

  useEffect(() => {
    // ROI Growth vs last month
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
    
    const trendMap = new Map<string, number>()
    monthlyNetIncomeTrend.forEach(m => {
      const d = new Date(m.month)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      trendMap.set(key, m.netIncome)
    })
    
    const currentNetIncome = trendMap.get(currentMonthKey) ?? 0
    const lastMonthNetIncome = trendMap.get(lastMonthKey) ?? 0
    const roiGrowthPercent = lastMonthNetIncome !== 0 
      ? ((currentNetIncome - lastMonthNetIncome) / Math.abs(lastMonthNetIncome)) * 100 
      : 0

    // Expense Ratio
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

    // Top Property
    const topProperty = profitLossData.length > 0 ? profitLossData[0].property : '—'

    // Projected Year-End Income
    const ytdMonths = monthlyNetIncomeTrend.filter(m => {
      const d = new Date(m.month)
      return d.getFullYear() === now.getFullYear() && d.getMonth() <= now.getMonth()
    })
    const ytdSum = ytdMonths.reduce((sum, m) => sum + m.netIncome, 0)
    const monthsElapsed = now.getMonth() + 1
    const avgMonthly = monthsElapsed > 0 ? ytdSum / monthsElapsed : 0
    const remainingMonths = 12 - monthsElapsed
    const projectedYearEnd = ytdSum + avgMonthly * remainingMonths

    setKpiMetrics({
      roiGrowth: roiGrowthPercent,
      expenseRatio,
      topProperty,
      projectedYearEnd
    })
  }, [profitLossData, monthlyData, monthlyNetIncomeTrend])

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4" style={{ background: '#F8FBFA' }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0A2540' }}>Financial Reports</h1>
              <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
                Comprehensive financial analysis and reporting
              </p>
            </div>
          </div>

          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            selectedRange={dateRange}
          />

          {/* KPI Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* ROI Growth */}
            <div 
              className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'rgba(26, 95, 122, 0.05)',
                border: '1px solid rgba(26, 95, 122, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-600">ROI Growth</div>
                <ArrowUpRight className="w-4 h-4" style={{ color: '#10B981' }} />
              </div>
              <div className="text-xl font-bold" style={{ color: '#10B981' }}>
                {kpiMetrics.roiGrowth >= 0 ? '+' : ''}{kpiMetrics.roiGrowth.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">vs last month</div>
            </div>

            {/* Expense Ratio */}
            <div 
              className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'rgba(100, 116, 139, 0.05)',
                border: '1px solid rgba(100, 116, 139, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-600">Expense Ratio</div>
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#1A5F7A"
                      strokeWidth="3"
                      strokeDasharray={`${(kpiMetrics.expenseRatio / 100) * 100.53} 100.53`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-semibold" style={{ color: '#1A5F7A' }}>
                      {Math.round(kpiMetrics.expenseRatio)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold" style={{ color: '#0A2540' }}>
                {Math.round(kpiMetrics.expenseRatio)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">of income</div>
            </div>

            {/* Top Property */}
            <div 
              className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'rgba(26, 95, 122, 0.05)',
                border: '1px solid rgba(26, 95, 122, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-600">Top Property</div>
                <Home className="w-4 h-4" style={{ color: '#1A5F7A' }} />
              </div>
              <div className="text-lg font-bold truncate" style={{ color: '#0A2540' }}>
                {kpiMetrics.topProperty}
              </div>
              <div className="text-xs text-gray-500 mt-1">Best performer</div>
            </div>

            {/* Projected Year-End Income */}
            <div 
              className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              style={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-600">Projected Year-End</div>
                <TrendingUpIcon className="w-4 h-4" style={{ color: '#10B981' }} />
              </div>
              <div className="text-xl font-bold" style={{ color: '#10B981' }}>
                ${kpiMetrics.projectedYearEnd.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Net Income</div>
            </div>
          </div>

          {/* Tax Summary Card */}
          <div className="rounded-2xl p-6 transition-all mb-8" style={{ backgroundColor: '#FCFDFD', boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0A2540' }}>Tax Summary</h2>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="px-4 py-2 rounded-full flex items-center gap-2 text-sm"
                  style={{ background: '#0F3D3E', color: 'white' }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border z-50" style={{ backgroundColor: '#FCFDFD', boxShadow: '0 10px 22px rgba(2,32,71,0.08)' }}>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <FileDown className="w-4 h-4 text-gray-600" /> PDF
                    </button>
                    <button onClick={() => exportCSV(profitLossData)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                      <FileSpreadsheet className="w-4 h-4 text-gray-600" /> CSV
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

          {/* Profit & Loss by Property */}
          <div className="rounded-2xl mb-8" style={{ backgroundColor: '#FCFDFD', boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold" style={{ color: '#0A2540' }}>Profit & Loss by Property</h2>
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
                <tbody style={{ backgroundColor: '#FCFDFD' }} className="divide-y divide-gray-200">
                  {profitLossData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50" style={{ backgroundColor: index === 0 && row.netIncome > 0 ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses by Category Pie Chart */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FCFDFD', boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#0A2540' }}>Expenses by Category</h2>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
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
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    {/* Center total - dual line */}
                    <g>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '18px', fill: '#0A2540', fontWeight: 700 }}>
                        ${totalCategoryAmount.toLocaleString()}
                      </text>
                      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fill: '#64748b', fontWeight: 400 }}>
                        Total Expenses
                      </text>
                    </g>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        const categoryName = props.payload?.name || 'Category'
                        const percentage = props.payload?.percentage || 0
                        return [
                          `${categoryName} — $${value.toLocaleString()} (${percentage.toFixed(1)}%)`,
                          ''
                        ]
                      }}
                      labelFormatter={() => ''}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => {
                        const data = categoryData.find((d: CategoryData) => d.name === value)
                        return `${value} (${data?.percentage.toFixed(1) || 0}%)`
                      }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Category Legend List */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(entry.name) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{entry.name}</div>
                        <div className="text-xs text-gray-600">
                          ${entry.value.toLocaleString()} ({entry.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Net Income Trend Chart */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FCFDFD', boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#0A2540' }}>Monthly Net Income Trend</h2>
                {monthlyNetIncomeTrend.length >= 2 && (
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const firstQuarter = monthlyNetIncomeTrend.slice(0, 3).reduce((sum, m) => sum + m.netIncome, 0) / 3
                      const lastQuarter = monthlyNetIncomeTrend.slice(-3).reduce((sum, m) => sum + m.netIncome, 0) / 3
                      const percentChange = firstQuarter !== 0 
                        ? ((lastQuarter - firstQuarter) / Math.abs(firstQuarter) * 100).toFixed(1)
                        : '0.0'
                      const isPositive = lastQuarter > firstQuarter
                      return (
                        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                          {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(percentChange))}% vs last quarter
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
              
              {/* Summary Stats - moved above chart */}
              <div className="mb-4 pb-4 border-b border-gray-200">
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
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyNetIncomeTrend}>
                    <defs>
                      <linearGradient id="colorNetIncomeTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A5F7A" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1A5F7A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNetIncomeNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        const currentIndex = monthlyNetIncomeTrend.findIndex((m: MonthlyNetIncomeData) => m.month === props.payload.month)
                        const prevIndex = currentIndex - 1
                        let comparisonText = ''
                        if (prevIndex >= 0) {
                          const prevValue = monthlyNetIncomeTrend[prevIndex].netIncome
                          const prevMonth = monthlyNetIncomeTrend[prevIndex].month
                          const delta = Number(value) - prevValue
                          const pct = prevValue !== 0 ? Math.round((delta / Math.abs(prevValue)) * 100) : 0
                          const isUp = delta >= 0
                          comparisonText = ` ${isUp ? '↑' : '↓'} ${isUp ? '+' : ''}${Math.abs(pct)}% from ${prevMonth}`
                        }
                        return [
                          `$${Number(value).toLocaleString()}${comparisonText}`,
                          'Net Income'
                        ]
                      }}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    {/* Area with teal gradient */}
                    <Area
                      type="monotone"
                      dataKey="netIncome"
                      stroke="#1A5F7A"
                      fillOpacity={1}
                      fill="url(#colorNetIncomeTeal)"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, index } = props
                        const isLatest = index === monthlyNetIncomeTrend.length - 1
                        const color = props.payload.netIncome < 0 ? '#ef4444' : '#1A5F7A'
                        
                        if (isLatest) {
                          // Glowing dot for latest point
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={8} fill="rgba(26, 95, 122, 0.2)" />
                              <circle cx={cx} cy={cy} r={6} fill={color} />
                              <circle cx={cx} cy={cy} r={3} fill="#fff" />
                            </g>
                          )
                        }
                        return (
                          <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />
                        )
                      }}
                    />
                    {/* Zero line reference */}
                    <Line
                      type="linear"
                      dataKey={() => 0}
                      stroke="#9ca3af"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      legendType="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
