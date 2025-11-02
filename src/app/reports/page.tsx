'use client'

import { useEffect, useState } from 'react'
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
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
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

export default function ReportsPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)
  
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
      
      // Use actual paid rent if available, otherwise fallback to monthly rent
      const incomeAmount = actualPaidRent > 0 ? actualPaidRent : property.monthly_rent
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

  const calculateCategoryData = (): CategoryData[] => {
    const filteredExpenses = getFilteredExpenses()
    const categoryMap = new Map<string, number>()
    
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

  const profitLossData = calculateProfitLoss()
  const categoryData = calculateCategoryData()
  const monthlyData = calculateMonthlyData()
  const taxSummary = calculateTaxSummary()

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6" key={`reports-${Date.now()}`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive financial analysis and reporting
              </p>
            </div>
          </div>

          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            selectedRange={dateRange}
          />

          {/* Tax Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tax Summary</h2>
              <button 
                onClick={handleExportPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export for Accountant
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${taxSummary.totalIncome.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Income (YTD)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  ${taxSummary.totalExpenses.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Deductible Expenses (YTD)</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${taxSummary.netTaxableIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${taxSummary.netTaxableIncome.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Net Taxable Income</div>
              </div>
            </div>
          </div>

          {/* Profit & Loss by Property */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Profit & Loss by Property</h2>
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
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.property}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${row.monthlyRent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-600">${row.totalExpenses.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${row.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.netIncome.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 text-sm ${row.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.roi.toFixed(1)}%
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Expenses by Category</h2>
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%" key={`pie-chart-${Date.now()}`}>
                  <PieChart>
                    <Pie
                      data={categoryData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="70%"
                      innerRadius="20%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{ 
                        fontSize: '14px', 
                        paddingTop: '15px' 
                      }}
                      formatter={(value, entry) => {
                        const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                        const percentage = total > 0 ? ((entry.payload?.value || 0) / total * 100).toFixed(1) : '0.0'
                        return `${value}: ${percentage}%`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Expenses Line Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Income vs Expenses Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
