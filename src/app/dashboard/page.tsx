'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getProperties, getMaintenanceTasks, getExpenses, updateMaintenanceTask, createExpense, getCurrentMonthRentStatus, getRentPayments } from '@/lib/database'
import { Property, MaintenanceTask, Expense, RentPayment } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  Home, 
  DollarSign, 
  Wrench, 
  Calendar,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
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
import CostInputModal from '@/components/CostInputModal'
import RentCollectionStatusChart from '@/components/RentCollectionStatusChart'

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

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceTask[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [rentPayments, setRentPayments] = useState<Record<string, RentPayment | null>>({})
  const [allRentPayments, setAllRentPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCostModal, setShowCostModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [pieChartDateRange, setPieChartDateRange] = useState<{ start: string; end: string } | null>(null)
  const [lineChartDateRange, setLineChartDateRange] = useState<{ start: string; end: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const [propertiesData, maintenanceData, expensesData, paymentsData, allPaymentsData] = await Promise.all([
        getProperties(user!.id),
        getMaintenanceTasks(user!.id),
        getExpenses(user!.id),
        getCurrentMonthRentStatus(user!.id).catch(() => ({})), // Load current month status for stats
        getRentPayments(user!.id).catch(() => []) // Load all rent payments for charts
      ])
      
      setProperties(propertiesData)
      setMaintenance(maintenanceData)
      setExpenses(expensesData)
      setRentPayments(paymentsData)
      setAllRentPayments(allPaymentsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Calculate totals
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.monthly_rent, 0)
  
  // Calculate this month's expenses
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })
  
  const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const upcomingTasks = maintenance.filter(m => m.status === 'pending').length

  // Calculate rent payment stats
  const propertiesWithTenants = properties.filter(p => p.tenant_name)
  const paidRentCount = propertiesWithTenants.filter(p => {
    const payment = rentPayments[p.id]
    return payment?.status === 'paid'
  }).length
  const unpaidRentCount = propertiesWithTenants.filter(p => {
    const payment = rentPayments[p.id]
    const isPaid = payment?.status === 'paid'
    const isOverdue = !isPaid && p.rent_due_date && currentDate.getDate() > p.rent_due_date
    return !isPaid
  }).length
  const overdueRentCount = propertiesWithTenants.filter(p => {
    const payment = rentPayments[p.id]
    const isPaid = payment?.status === 'paid'
    return !isPaid && p.rent_due_date && currentDate.getDate() > p.rent_due_date
  }).length

  const getExpensesByProperty = (propertyId: string) => {
    return expenses.filter(e => e.property_id === propertyId).reduce((sum, e) => sum + e.amount, 0)
  }

  const handleMarkComplete = async (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent the click from navigating to maintenance page
    
    const task = maintenance.find(t => t.id === taskId)
    if (!task) return

    // Show cost input modal
    setSelectedTask(task)
    setShowCostModal(true)
  }

  const handleCostConfirm = async (cost: number) => {
    if (!selectedTask || !user) return

    try {
      // Update maintenance task status
      await updateMaintenanceTask(selectedTask.id, { status: 'completed' })
      
      // Create expense entry
      const property = properties.find(p => p.id === selectedTask.property_id)
      await createExpense({
        user_id: user.id,
        property_id: selectedTask.property_id,
        date: new Date().toISOString().split('T')[0],
        amount: cost,
        category: 'Maintenance',
        description: `${selectedTask.task}${property ? ` - ${property.nickname || property.address}` : ''}`,
        is_recurring: false,
        recurring_frequency: undefined
      })

      // Update local state
      setMaintenance(prev => 
        prev.map(task => 
          task.id === selectedTask.id 
            ? { ...task, status: 'completed' as const }
            : task
        )
      )

      // Reload expenses to show the new entry
      const expensesData = await getExpenses(user.id)
      setExpenses(expensesData)

    } catch (error) {
      console.error('Error completing task and adding expense:', error)
      throw error
    }
  }

  const handleEmailTenant = (property: Property, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent the click from navigating to properties page
    
    if (!property.tenant_email) {
      alert('No email address available for this tenant')
      return
    }

    const subject = encodeURIComponent(`Regarding ${property.nickname || property.address}`)
    const body = encodeURIComponent(
      `Hello ${property.tenant_name || 'Tenant'},\n\n` +
      `I hope this message finds you well. I'm writing regarding the property at ${property.nickname || property.address}.\n\n`
    )
    
    const mailtoLink = `mailto:${property.tenant_email}?subject=${subject}&body=${body}`
    window.open(mailtoLink, '_blank')
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

  const handleLineChartDateRange = (rangeName: string | null) => {
    if (rangeName === null) {
      setLineChartDateRange(null)
      return
    }
    
    const options = getDateRangeOptions()
    const range = options[rangeName as keyof typeof options]
    if (range) {
      setLineChartDateRange(range)
    }
  }

  const getCurrentLineChartRangeLabel = () => {
    if (!lineChartDateRange) return 'All Time'
    
    const options = getDateRangeOptions()
    for (const [name, range] of Object.entries(options)) {
      if (range.start === lineChartDateRange.start && range.end === lineChartDateRange.end) {
        return name
      }
    }
    
    return `Custom: ${lineChartDateRange.start} to ${lineChartDateRange.end}`
  }

  const calculateCategoryData = (): CategoryData[] => {
    const categoryMap = new Map<string, number>()
    
    // Filter expenses by date range if set
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

  const calculateMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    const now = new Date()
    
    // Determine date range for months
    if (lineChartDateRange) {
      // Use selected date range
      const startDate = new Date(lineChartDateRange.start)
      const endDate = new Date(lineChartDateRange.end)
      
      // Generate all months within the date range
      let rangeIterator = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      
      while (rangeIterator <= end) {
        const monthKey = rangeIterator.toISOString().slice(0, 7) // YYYY-MM
        monthlyMap.set(monthKey, { income: 0, expenses: 0 })
        rangeIterator.setMonth(rangeIterator.getMonth() + 1)
      }
    } else {
      // Default: All Time - find the earliest month from expenses or property creation
      let earliestMonth: Date | null = null
      let latestMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Check expenses for earliest date
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date)
        const expenseMonth = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1)
        if (!earliestMonth || expenseMonth < earliestMonth) {
          earliestMonth = expenseMonth
        }
      })
      
      // Check property creation dates for earliest date
      properties.forEach(property => {
        const createdDate = new Date(property.created_at)
        const createdMonth = new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)
        if (!earliestMonth || createdMonth < earliestMonth) {
          earliestMonth = createdMonth
        }
      })
      
      // Check rent payments for earliest date
      allRentPayments.forEach(payment => {
        const paymentMonth = new Date(payment.year, payment.month - 1, 1)
        if (!earliestMonth || paymentMonth < earliestMonth) {
          earliestMonth = paymentMonth
        }
      })
      
      // If no data exists, default to last 6 months
      if (!earliestMonth) {
        earliestMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      }
      
      // Generate all months from earliest to current
      let monthIterator = new Date(earliestMonth)
      while (monthIterator <= latestMonth) {
        const monthKey = monthIterator.toISOString().slice(0, 7) // YYYY-MM
        monthlyMap.set(monthKey, { income: 0, expenses: 0 })
        monthIterator.setMonth(monthIterator.getMonth() + 1)
      }
    }
    
    // Add expenses (filtered by date range if set)
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      
      // If date range is set, filter expenses
      if (lineChartDateRange) {
        const startDate = new Date(lineChartDateRange.start)
        const endDate = new Date(lineChartDateRange.end)
        if (expenseDate < startDate || expenseDate > endDate) {
          return // Skip expenses outside the range
        }
      }
      
      const monthKey = expenseDate.toISOString().slice(0, 7)
      const existingMonth = monthlyMap.get(monthKey)
      if (existingMonth) {
        existingMonth.expenses += expense.amount
      } else {
        // If month not in map (shouldn't happen with all time), add it
        monthlyMap.set(monthKey, { income: 0, expenses: expense.amount })
      }
    })
    
    // Add income from actual rent payments (only paid payments)
    console.log('Dashboard: Total rent payments loaded:', allRentPayments.length)
    console.log('Dashboard: All rent payments:', allRentPayments)
    const paidPayments = allRentPayments.filter(payment => payment.status === 'paid')
    console.log('Dashboard: Paid rent payments:', paidPayments.length)
    
    // Debug logging
    if (paidPayments.length > 0) {
      console.log('Dashboard: Processing rent payments for chart:', paidPayments.length, 'paid payments')
      console.log('Dashboard: Sample payment:', paidPayments[0])
    } else {
      console.log('Dashboard: No paid payments found')
    }
    
    paidPayments.forEach(payment => {
      // Create month key from payment year and month (1-12)
      const monthKey = `${payment.year}-${String(payment.month).padStart(2, '0')}`
      
      // Debug logging for November 2025
      if (payment.year === 2025 && payment.month === 11) {
        console.log('Dashboard: Found November 2025 payment:', payment)
        console.log('Dashboard: Month key:', monthKey)
        console.log('Dashboard: Date range:', lineChartDateRange)
      }
      
      // If date range is set, filter payments within range
      if (lineChartDateRange) {
        // Compare at month level: payment month must be within the date range
        // Extract year-month from date range (YYYY-MM format)
        const startMonth = lineChartDateRange.start.slice(0, 7) // e.g., "2025-10"
        const endMonth = lineChartDateRange.end.slice(0, 7) // e.g., "2025-12"
        
        // Debug logging for November
        if (payment.year === 2025 && payment.month === 11) {
          console.log('Dashboard: Comparing', monthKey, 'with range', startMonth, 'to', endMonth)
        }
        
        // Check if payment month is within range
        if (monthKey < startMonth || monthKey > endMonth) {
          if (payment.year === 2025 && payment.month === 11) {
            console.log('Dashboard: November payment filtered out by date range')
          }
          return // Skip payments outside the range
        }
      }
      
      // Ensure the month is in the map (add it if not already there)
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expenses: 0 })
      }
      
      const existingMonth = monthlyMap.get(monthKey)!
      const previousIncome = existingMonth.income
      existingMonth.income += payment.amount
      
      // Debug logging
      if (payment.year === 2025 && payment.month === 11) {
        console.log('Dashboard: Added payment to November. Previous income:', previousIncome, 'Payment amount:', payment.amount, 'New income:', existingMonth.income)
      }
    })
    
    const result = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income: data.income,
      expenses: data.expenses
    }))
    
    return result
  }

  // Calculate cash flow forecast for next 3 months
  const calculateCashFlowForecast = () => {
    const now = new Date()
    const forecast = []
    
    // Calculate average monthly expenses from historical data (for fallback)
    const lastThreeMonthsExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        const monthsAgo = (now.getFullYear() - expenseDate.getFullYear()) * 12 + 
                         (now.getMonth() - expenseDate.getMonth())
        return monthsAgo >= 0 && monthsAgo < 3
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    // Count number of months with expenses (for better averaging)
    const expenseMonths = new Set(
      expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          const monthsAgo = (now.getFullYear() - expenseDate.getFullYear()) * 12 + 
                           (now.getMonth() - expenseDate.getMonth())
          return monthsAgo >= 0 && monthsAgo < 3
        })
        .map(expense => {
          const expenseDate = new Date(expense.date)
          return `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`
        })
    ).size
    
    // Average monthly expenses (from last 3 months), or use current month if no historical data
    const averageMonthlyExpenses = expenseMonths > 0 
      ? lastThreeMonthsExpenses / expenseMonths 
      : (totalExpenses > 0 ? totalExpenses : 0)
    
    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthName = forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      // Projected income: sum of all properties' monthly rent
      const projectedIncome = properties.reduce((sum, property) => sum + property.monthly_rent, 0)
      
      // Check if there are actual expenses logged for this forecast month
      const forecastYear = forecastDate.getFullYear()
      const forecastMonth = forecastDate.getMonth() // 0-indexed (0 = Jan, 11 = Dec)
      
      const actualExpensesForMonth = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          const expenseYear = expenseDate.getFullYear()
          const expenseMonth = expenseDate.getMonth()
          
          // Match if same year and month
          return expenseYear === forecastYear && expenseMonth === forecastMonth
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
      
      // Debug logging
      if (i === 1) {
        console.log('Cash Flow Forecast Debug for first month:', {
          forecastMonth: monthName,
          forecastYear,
          forecastMonthIndex: forecastMonth,
          expensesInMonth: expenses.filter(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate.getFullYear() === forecastYear && expenseDate.getMonth() === forecastMonth
          }).map(e => ({ date: e.date, amount: e.amount })),
          actualExpensesForMonth
        })
      }
      
      // Use actual expenses if available, otherwise use average
      const projectedExpenses = actualExpensesForMonth > 0 
        ? actualExpensesForMonth 
        : (averageMonthlyExpenses || 0)
      
      const netCashFlow = projectedIncome - projectedExpenses
      
      forecast.push({
        month: monthName,
        income: projectedIncome,
        expenses: projectedExpenses,
        netCashFlow: netCashFlow
      })
    }
    
    return forecast
  }

  // Get consistent color for a category name
  const getCategoryColor = (categoryName: string): string => {
    // Predefined colors for common categories
    const categoryColorMap: Record<string, string> = {
      'Maintenance': '#3b82f6',      // Blue
      'Repairs': '#ef4444',           // Red
      'Utilities': '#10b981',         // Green
      'Insurance': '#f59e0b',         // Yellow/Orange
      'Property Tax': '#8b5cf6',     // Purple
      'Taxes': '#8b5cf6',            // Purple (alternative name)
      'HOA Fees': '#06b6d4',         // Cyan
      'Lawn Care': '#84cc16',         // Lime
      'Pest Control': '#f97316',     // Orange
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

  // Calculate chart data
  const categoryData = calculateCategoryData()
  const monthlyData = calculateMonthlyData()
  const cashFlowForecast = calculateCashFlowForecast()
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Top Section: Stats Cards and Rent Collection Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Stats Cards (2x2 grid) */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* Top Row */}
              <div 
                className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[140px]"
                onClick={() => router.push('/properties')}
              >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-base md:text-base font-bold">Total Properties</p>
                    <p className="text-3xl md:text-3xl font-bold text-gray-800 mt-1">{properties.length}</p>
                  </div>
                  <Home className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>
              
              <div 
                className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[140px]"
                onClick={() => router.push('/maintenance')}
              >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-base md:text-base font-bold">Upcoming Tasks</p>
                    <p className="text-3xl md:text-3xl font-bold text-orange-600 mt-1">{upcomingTasks}</p>
                  </div>
                  <Calendar className="w-8 h-8 md:w-12 md:h-12 text-orange-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>

              {/* Bottom Row */}
              <div 
                className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[140px]"
                onClick={() => router.push('/reports')}
              >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-base md:text-base font-bold">Monthly Rent</p>
                    <p className="text-3xl md:text-3xl font-bold text-green-600 mt-1">${totalMonthlyRent.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>
              
              <div 
                className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[140px]"
                onClick={() => router.push('/expenses')}
              >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-500 text-base md:text-base font-bold">This Month's Expenses</p>
                    <p className="text-3xl md:text-3xl font-bold text-red-600 mt-1">${totalExpenses.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-red-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {/* Right Side: Rent Collection Status Chart */}
            {propertiesWithTenants.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <RentCollectionStatusChart 
                  properties={properties}
                  rentPayments={allRentPayments}
                />
              </div>
            )}
          </div>

          {/* Properties Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Properties Overview</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map(property => {
                  const propertyExpenses = getExpensesByProperty(property.id)
                  const netForProperty = property.monthly_rent - propertyExpenses
                  return (
                    <div 
                      key={property.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push('/properties')}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              {property.nickname || property.address}
                            </h3>
                            {property.nickname && (
                              <span className="text-xs text-gray-500">({property.address})</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Tenant: {property.tenant_name || 'Vacant'}</p>
                          {property.tenant_email && (
                            <p className="text-sm text-gray-500">Email: {property.tenant_email}</p>
                          )}
                          <p className="text-sm text-gray-500">Rent Due: {property.rent_due_date ? `${property.rent_due_date}${property.rent_due_date === 1 ? 'st' : property.rent_due_date === 2 ? 'nd' : property.rent_due_date === 3 ? 'rd' : property.rent_due_date === 21 ? 'st' : property.rent_due_date === 22 ? 'nd' : property.rent_due_date === 23 ? 'rd' : property.rent_due_date === 31 ? 'st' : 'th'}` : '1st'} of each month</p>
                          
                          {/* Rent Payment Status */}
                          {property.tenant_name && (() => {
                            const payment = rentPayments[property.id]
                            const isPaid = payment?.status === 'paid'
                            const isOverdue = !isPaid && property.rent_due_date && currentDate.getDate() > property.rent_due_date
                            return (
                              <div className="mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                  isPaid 
                                    ? 'bg-green-100 text-green-700' 
                                    : isOverdue 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {isPaid ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Rent Paid</span>
                                    </>
                                  ) : isOverdue ? (
                                    <>
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Overdue</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Unpaid</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            )
                          })()}
                          
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-600">Rent: ${property.monthly_rent}/mo</span>
                            <span className="text-red-600">Expenses: ${propertyExpenses}</span>
                            <span className={`font-semibold ${netForProperty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Net: ${netForProperty}
                            </span>
                          </div>
                        </div>
                        {property.tenant_email && (
                          <button
                            onClick={(e) => handleEmailTenant(property, e)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Email Tenant</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Maintenance</h2>
            </div>
            <div className="p-6">
              {maintenance.filter(m => m.status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming maintenance tasks</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {maintenance.filter(m => m.status === 'pending').map(task => {
                    const property = properties.find(p => p.id === task.property_id)
                    return (
                      <div 
                        key={task.id} 
                        className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => router.push('/maintenance')}
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800">{task.task}</h3>
                          <p className="text-sm text-gray-500">{property ? (property.nickname || property.address) : 'Unknown Property'}</p>
                          <p className="text-sm text-orange-600 mt-1">Scheduled: {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                        <button 
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={(e) => handleMarkComplete(task.id, e)}
                        >
                          Mark Complete
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses by Category Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Expenses by Category</h2>
                <div className="text-sm text-gray-600">
                  Current: {getCurrentPieChartRangeLabel()}
                </div>
              </div>
              
              {/* Date Range Filter Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handlePieChartDateRange(null)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    !pieChartDateRange
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
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
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
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
                      outerRadius="70%"
                      innerRadius="20%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
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

            {/* Cash Flow Forecast Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Cash Flow Forecast (Next 3 Months)</h2>
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowForecast}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorIncome)"
                      name="Projected Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorExpenses)"
                      name="Projected Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netCashFlow" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      name="Net Cash Flow"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Summary */}
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                {cashFlowForecast.map((month, index) => (
                  <div key={index} className="text-center">
                    <p className="text-xs text-gray-600 mb-1">{month.month}</p>
                    <p className={`text-lg font-semibold ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${month.netCashFlow.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Net Flow</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Cost Input Modal */}
        <CostInputModal
          isOpen={showCostModal}
          onClose={() => {
            setShowCostModal(false)
            setSelectedTask(null)
          }}
          onConfirm={handleCostConfirm}
          taskName={selectedTask?.task || ''}
          propertyAddress={properties.find(p => p.id === selectedTask?.property_id)?.address || ''}
        />
      </Layout>
    </ProtectedRoute>
  )
}
