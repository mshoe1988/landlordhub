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
import { Download, TrendingUp, TrendingDown, DollarSign, FileDown, FileSpreadsheet } from 'lucide-react'
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
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(getThisMonthRange())

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
  const totalCategoryAmount = useMemo(() => categoryData.reduce((s, c) => s + c.value, 0), [expenses, pieChartDateRange])

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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6" key={`reports-${Date.now()}`} style={{ background: '#F8FBFA' }}>
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

          {/* Tax Summary Card */}
          <div className="bg-white rounded-xl p-6 transition-all" style={{ boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0A2540' }}>Tax Summary</h2>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="px-4 py-2 rounded-full flex items-center gap-2 shadow-sm"
                  style={{ background: '#0F3D3E', color: 'white' }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border" style={{ boxShadow: '0 10px 22px rgba(2,32,71,0.08)' }}>
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
          <div className="bg-white rounded-xl" style={{ boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
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
                <tbody className="bg-white divide-y divide-gray-200">
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
            <div className="bg-white rounded-xl p-6" style={{ boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
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
                <ResponsiveContainer width="100%" height="100%" key={`pie-chart-${Date.now()}`}>
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
                    {/* Center total */}
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '18px', fill: '#0A2540', fontWeight: 700 }}>
                      ${totalCategoryAmount.toLocaleString()}
                    </text>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Net Income Trend Chart */}
            <div className="bg-white rounded-xl p-6" style={{ boxShadow: '0 8px 24px rgba(2, 32, 71, 0.06)' }}>
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
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyNetIncomeTrend}>
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
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorNetIncomePositive)"
                      strokeWidth={2}
                      strokeDasharray=""
                      dot={(props: any) => {
                        const { cx, cy, payload } = props
                        const color = payload.netIncome < 0 ? '#ef4444' : '#10b981'
                        return (
                          <circle cx={cx} cy={cy} r={5} fill={color} stroke={color} strokeWidth={2} />
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
