
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
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
  AlertCircle,
  Clock,
  AlertTriangle,
  Paperclip
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
  Line,
  BarChart,
  Bar,
  LabelList,
  ComposedChart
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

function DashboardPage() {
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
  const [cashflowDateRange, setCashflowDateRange] = useState<string>('all-time')
  const [countUpValues, setCountUpValues] = useState({
    properties: 0,
    tasks: 0,
    rent: 0,
    expenses: 0
  })
  const [showOverdueBanner, setShowOverdueBanner] = useState<boolean>(false)
  const [overdueCount, setOverdueCount] = useState<number>(0)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  // Calculate totals for count-up animation
  const totalMonthlyRent = properties.reduce((sum, p) => sum + p.monthly_rent, 0)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })
  const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const upcomingTasks = maintenance.filter(m => m.status === 'pending').length

  // Count-up animation for KPI cards
  useEffect(() => {
    if (!loading && properties.length >= 0) {
      const duration = 1500 // 1.5 seconds
      const steps = 60
      const interval = duration / steps
      
      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const progress = Math.min(currentStep / steps, 1)
        // Ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        setCountUpValues({
          properties: Math.round(properties.length * easeOut),
          tasks: Math.round(upcomingTasks * easeOut),
          rent: Math.round(totalMonthlyRent * easeOut),
          expenses: Math.round(totalExpenses * easeOut)
        })
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setCountUpValues({
            properties: properties.length,
            tasks: upcomingTasks,
            rent: totalMonthlyRent,
            expenses: totalExpenses
          })
        }
      }, interval)
      
      return () => clearInterval(timer)
    }
  }, [loading, properties.length, upcomingTasks, totalMonthlyRent, totalExpenses])

  // Memoized chart data and labels (must be before any early returns)
  const categoryData = useMemo(() => calculateCategoryData(), [expenses, pieChartDateRange])
  const monthlyData = useMemo(() => calculateMonthlyData(), [expenses, properties, allRentPayments, lineChartDateRange])
  const cashFlowForecast = useMemo(() => calculateCashFlowForecast(), [expenses, properties])
  const cashflowDataMemo = useMemo(() => calculateCashflowData(), [expenses, allRentPayments, cashflowDateRange, properties])
  const hasCashflowData = useMemo(
    () => cashflowDataMemo.length > 0 && cashflowDataMemo.some((entry: any) => entry.income > 0 || entry.expenses > 0),
    [cashflowDataMemo]
  )
  const cashflowSummary = useMemo(() => {
    const data = cashflowDataMemo
    if (data.length === 0) return null
    const totalCashflow = data.reduce((sum: number, entry: any) => sum + entry.cashflow, 0)
    const lastEntry = data[data.length - 1]
    const secondLastEntry = data.length > 1 ? data[data.length - 2] : null
    let percentageChange: number | null = null
    if (secondLastEntry && secondLastEntry.cashflow !== 0) {
      percentageChange = ((lastEntry.cashflow - secondLastEntry.cashflow) / Math.abs(secondLastEntry.cashflow)) * 100
    }
    return {
      totalCashflow,
      lastMonthCashflow: lastEntry.cashflow,
      percentageChange,
      isPositive: totalCashflow > 0
    }
  }, [cashflowDataMemo])
  const cashflowPeriodLabel = useMemo(() => getCashflowPeriodLabel(), [cashflowDateRange])

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

  // Calculate rent collection percentage for smart insight
  const getRentCollectionPercentage = () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    const paidPayments = allRentPayments.filter(
      p => p.status === 'paid' && p.month === currentMonth && p.year === currentYear
    )
    const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0)
    
    if (totalMonthlyRent === 0) return null
    return Math.round((paidAmount / totalMonthlyRent) * 100)
  }
  

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

  // Check if task is overdue (date-only)
  const isOverdue = (task: MaintenanceTask) => {
    if (task.status === 'completed') return false
    const dueDate = new Date(task.due_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() < today.getTime()
  }

  // Check if task is due soon (within next 2 days, date-only)
  const isDueSoon = (task: MaintenanceTask) => {
    if (task.status === 'completed') return false
    const dueDate = new Date(task.due_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / msPerDay)
    return daysUntilDue > 0 && daysUntilDue <= 2
  }

  // On mount: if any overdue tasks exist, show a once-per-day banner
  useEffect(() => {
    if (!loading) {
      const todayKey = new Date().toISOString().slice(0, 10)
      const storageKey = `overdue-banner-${todayKey}`
      const alreadyShown = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : '1'
      const overdueTasks = maintenance.filter(t => isOverdue(t)).length
      setOverdueCount(overdueTasks)
      if (!alreadyShown && overdueTasks > 0) {
        setShowOverdueBanner(true)
      }
    }
  }, [loading, maintenance])

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

  function calculateCategoryData(): CategoryData[] {
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

  function calculateMonthlyData(): MonthlyData[] {
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
  function calculateCashFlowForecast() {
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

  // Helper function to get monthKey (YYYY-MM) using local time (not UTC)
  function getMonthKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  // Calculate cashflow data based on selected time period
  function calculateCashflowData() {
    const now = new Date()
    // Debug: Log current date information
    console.log('[Cashflow] Current date:', now)
    console.log('[Cashflow] Current month (0-indexed):', now.getMonth())
    console.log('[Cashflow] Current year:', now.getFullYear())
    console.log('[Cashflow] Current month key:', getMonthKey(now))
    console.log('[Cashflow] Selected range:', cashflowDateRange)
    
    const monthlyMap = new Map<string, { income: number; expenses: number; cashflow: number }>()
    
    // Determine date range based on selected period
    let startDate: Date | null = null
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0) // End of current month
    
    switch (cashflowDateRange) {
      case 'all-time':
        // Find earliest date from expenses, properties, or rent payments
        expenses.forEach(expense => {
          const expenseDate = new Date(expense.date)
          if (!startDate || expenseDate < startDate) {
            startDate = expenseDate
          }
        })
        properties.forEach(property => {
          const createdDate = new Date(property.created_at)
          if (!startDate || createdDate < startDate) {
            startDate = createdDate
          }
        })
        allRentPayments.forEach(payment => {
          const paymentDate = new Date(payment.year, payment.month - 1, 1)
          if (!startDate || paymentDate < startDate) {
            startDate = paymentDate
          }
        })
        if (!startDate) {
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1) // Default to last 6 months
        }
        break
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last-quarter':
        // Last quarter = last 3 months
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last-year':
        // Last year = past 12 months (rolling)
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // End of current month
        break
    }
    
    // Ensure startDate is not null (TypeScript narrowing)
    if (!startDate) {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1) // Default to last 6 months
    }
    
    // Now TypeScript knows startDate is not null, but we'll use a const for clarity
    const finalStartDate: Date = startDate
    
    // Generate all months within the date range
    // Always ensure we include the current month (November) for all date ranges
    let monthIterator = new Date(finalStartDate.getFullYear(), finalStartDate.getMonth(), 1)
    let endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    // Always ensure we include the current month if it's not already included
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    if (endMonth < currentMonth) {
      endMonth = currentMonth
    }
    
    while (monthIterator <= endMonth) {
      const monthKey = getMonthKey(monthIterator) // Use local time, not UTC
      monthlyMap.set(monthKey, { income: 0, expenses: 0, cashflow: 0 })
      monthIterator.setMonth(monthIterator.getMonth() + 1)
    }
    
    // Add expenses
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate >= finalStartDate && expenseDate <= endDate) {
        const monthKey = getMonthKey(expenseDate) // Use local time, not UTC
        const existingMonth = monthlyMap.get(monthKey)
        if (existingMonth) {
          existingMonth.expenses += expense.amount
        }
      }
    })
    
    // Add income from paid rent payments
    const paidPayments = allRentPayments.filter(payment => payment.status === 'paid')
    paidPayments.forEach(payment => {
      const paymentDate = new Date(payment.year, payment.month - 1, 1)
      if (paymentDate >= finalStartDate && paymentDate <= endMonth) {
        const monthKey = `${payment.year}-${String(payment.month).padStart(2, '0')}`
        const existingMonth = monthlyMap.get(monthKey)
        if (existingMonth) {
          existingMonth.income += payment.amount
        } else {
          monthlyMap.set(monthKey, { income: payment.amount, expenses: 0, cashflow: 0 })
        }
      }
    })
    
    // Calculate cashflow (income - expenses) for each month
    let result = Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        const cashflow = data.income - data.expenses
        // Parse monthKey (YYYY-MM) and create Date in local time, not UTC
        const [year, month] = monthKey.split('-').map(Number)
        const monthDate = new Date(year, month - 1, 1) // month is 0-indexed in Date constructor
        return {
          monthKey, // Keep original key for sorting
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income: data.income,
          expenses: data.expenses,
          cashflow: cashflow,
          cumulativeCashflow: 0 // Will be calculated below
        }
      })
      .sort((a, b) => {
        // Sort by monthKey (YYYY-MM format)
        return a.monthKey.localeCompare(b.monthKey)
      })
    
    // Calculate cumulative cashflow
    let cumulative = 0
    result = result.map(entry => {
      cumulative += entry.cashflow
      return { ...entry, cumulativeCashflow: cumulative }
    })
    
    // ALWAYS ensure current month is included in the result
    const currentMonthKey = getMonthKey(now) // Use local time, not UTC
    const currentMonthExists = result.some(r => r.monthKey === currentMonthKey)
    if (!currentMonthExists && cashflowDateRange !== 'last-month') {
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      result.push({
        monthKey: currentMonthKey,
        month: currentMonthLabel,
        income: 0,
        expenses: 0,
        cashflow: 0,
        cumulativeCashflow: cumulative
      })
      // Re-sort to maintain chronological order
      result.sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      // Recalculate cumulative after adding current month
      cumulative = 0
      result = result.map(entry => {
        cumulative += entry.cashflow
        return { ...entry, cumulativeCashflow: cumulative }
      })
    }
    
    // For "this-month", ensure we only show the current month
    if (cashflowDateRange === 'this-month') {
      const currentMonthKeyLocal = getMonthKey(now)
      console.log('[Cashflow] Filtering for this-month, looking for key:', currentMonthKeyLocal)
      console.log('[Cashflow] Available monthKeys before filter:', result.map(r => r.monthKey))
      
      result = result.filter(entry => entry.monthKey === currentMonthKeyLocal)
      console.log('[Cashflow] Result after filter:', result)
      
      // If no data for current month, add it with zero values
      if (result.length === 0) {
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)
        const currentMonthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        console.log('[Cashflow] No data found, adding current month with label:', currentMonthLabel)
        result = [{
          monthKey: currentMonthKeyLocal,
          month: currentMonthLabel,
          income: 0,
          expenses: 0,
          cashflow: 0,
          cumulativeCashflow: 0
        }]
      }
      // Recalculate cumulative
      cumulative = 0
      result = result.map(entry => {
        cumulative += entry.cashflow
        return { ...entry, cumulativeCashflow: cumulative }
      })
    }
    
    // Ensure at least 3 months are shown (pad with zero months if needed)
    // Only pad if we're showing "all-time" or if the selected range naturally has multiple months
    // For "this-month" or "last-month", we only want to show that specific month
    if (result.length < 3 && cashflowDateRange !== 'this-month' && cashflowDateRange !== 'last-month') {
      const monthsToShow = 3
      
      // Build array of months to show, starting from current month going back
      const monthsToAdd: Array<{ monthKey: string; month: string }> = []
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = getMonthKey(monthDate) // Use local time, not UTC
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthsToAdd.push({ monthKey, month: monthLabel })
      }
      
      // Add missing months to result (in reverse order to maintain chronological order)
      for (let i = monthsToAdd.length - 1; i >= 0; i--) {
        const { monthKey, month } = monthsToAdd[i]
        const exists = result.some(r => r.monthKey === monthKey)
        if (!exists) {
          result.unshift({
            monthKey,
            month,
            income: 0,
            expenses: 0,
            cashflow: 0,
            cumulativeCashflow: 0
          })
        }
      }
      
      // Recalculate cumulative after adding months
      cumulative = 0
      result = result.map(entry => {
        cumulative += entry.cashflow
        return { ...entry, cumulativeCashflow: cumulative }
      })
    }
    
    // For "last-month", ensure we only show the last month (October if we're in November)
    // We need to filter before removing monthKey so we can use it for matching
    if (cashflowDateRange === 'last-month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthKey = getMonthKey(lastMonthDate) // Use local time, not UTC
      
      // Filter result to only include the last month using monthKey
      result = result.filter(entry => entry.monthKey === lastMonthKey)
      
      // If no data for last month, add it with zero values
      if (result.length === 0) {
        const lastMonthLabel = lastMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        result = [{
          monthKey: lastMonthKey,
          month: lastMonthLabel,
          income: 0,
          expenses: 0,
          cashflow: 0,
          cumulativeCashflow: 0
        }]
      }
      
      // Recalculate cumulative
      cumulative = 0
      result = result.map(entry => {
        cumulative += entry.cashflow
        return { ...entry, cumulativeCashflow: cumulative }
      })
    }
    
    // Debug: Log final result before removing monthKey
    console.log('[Cashflow] Final result before removing monthKey:', result.map(r => ({ monthKey: r.monthKey, month: r.month })))
    
    // Remove monthKey from final result
    return result.map(({ monthKey, ...rest }) => rest)
  }

  // Calculate cashflow summary statistics
  function getCashflowSummary() {
    const data = calculateCashflowData()
    if (data.length === 0) return null
    
    const totalCashflow = data.reduce((sum, entry) => sum + entry.cashflow, 0)
    const lastEntry = data[data.length - 1]
    const secondLastEntry = data.length > 1 ? data[data.length - 2] : null
    
    let percentageChange: number | null = null
    if (secondLastEntry && secondLastEntry.cashflow !== 0) {
      percentageChange = ((lastEntry.cashflow - secondLastEntry.cashflow) / Math.abs(secondLastEntry.cashflow)) * 100
    }
    
    return {
      totalCashflow,
      lastMonthCashflow: lastEntry.cashflow,
      percentageChange,
      isPositive: totalCashflow > 0
    }
  }

  // Get time period label
  function getCashflowPeriodLabel() {
    switch (cashflowDateRange) {
      case 'all-time':
        return 'All Time'
      case 'this-month':
        return 'This Month'
      case 'last-month':
        return 'Last Month'
      case 'last-quarter':
        return 'Last 3 Months'
      case 'last-year':
        return 'Last Year'
      default:
        return 'All Time'
    }
  }

  // Get consistent color for a category name
  const getCategoryColor = (categoryName: string): string => {
    // Predefined colors for common categories
    const categoryColorMap: Record<string, string> = {
      'Maintenance': '#3b82f6',      // Blue
      'Repairs': '#E8684A',          // Soft coral
      'Utilities': '#10b981',         // Green
      'Insurance': '#F6BD16',         // Muted gold
      'Property Tax': '#5B8FF9',     // Deep blue
      'Taxes': '#5B8FF9',            // Deep blue (alternative name)
      'HOA Fees': '#06b6d4',         // Cyan
      'Lawn Care': '#6DC8A0',         // Soft mint green
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
  
  // Get gradient colors for pie chart slices
  const getCategoryGradientColors = (baseColor: string) => {
    const gradientMap: Record<string, { from: string; to: string }> = {
      '#3b82f6': { from: '#5E72E4', to: '#A7B8F7' }, // Blue
      '#E8684A': { from: '#E45B56', to: '#F19C98' }, // Red
      '#10b981': { from: '#1C7C63', to: '#A7D6C9' }, // Teal
      '#F6BD16': { from: '#F7A43F', to: '#FCD07D' }, // Orange
      '#5B8FF9': { from: '#5E72E4', to: '#A7B8F7' }, // Blue
      '#06b6d4': { from: '#1C7C63', to: '#A7D6C9' }, // Cyan -> Teal
      '#6DC8A0': { from: '#1C7C63', to: '#A7D6C9' }, // Mint -> Teal
      '#f97316': { from: '#F7A43F', to: '#FCD07D' }, // Orange
      '#ec4899': { from: '#E45B56', to: '#F19C98' }, // Pink -> Red
      '#14b8a6': { from: '#1C7C63', to: '#A7D6C9' }, // Teal
      '#6366f1': { from: '#5E72E4', to: '#A7B8F7' }, // Indigo -> Blue
      '#64748b': { from: '#64748b', to: '#94a3b8' }  // Gray
    }
    return gradientMap[baseColor] || { from: baseColor, to: baseColor }
  }
  
  // Calculate expenses comparison for insight banner
  const getExpensesComparison = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const currentMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, e) => sum + e.amount, 0)
    
    const lastMonthExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear
      })
      .reduce((sum, e) => sum + e.amount, 0)
    
    if (lastMonthExpenses === 0) return null
    
    const change = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    const lastMonthName = new Date(lastMonthYear, lastMonth, 1).toLocaleDateString('en-US', { month: 'long' })
    
    return {
      change: Math.round(change),
      current: currentMonthExpenses,
      last: lastMonthExpenses,
      lastMonthName
    }
  }

  // moved above early return
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6" style={{ 
          gap: '24px',
          background: 'linear-gradient(to bottom, #EAF4F1, #E7F2EF)',
          minHeight: '100vh',
          padding: '24px'
        }}>
          {/* Top Section: Stats Cards and Rent Collection Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '24px' }}>
            {/* Left Side: Stats Cards (2x2 grid) */}
            <div className="grid grid-cols-2" style={{ gap: '24px' }}>
              {/* Top Row */}
              <div 
                className="bg-white p-4 md:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
                style={{ 
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              onClick={() => router.push('/properties')}
            >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4" style={{ color: '#0A2540', opacity: 0.6 }} />
                      <p className="text-gray-900 font-bold" style={{ fontSize: '18px', lineHeight: '1.4' }}>
                        Total Properties
                      </p>
                </div>
                    <p className="font-bold text-gray-800 mt-2" style={{ fontSize: '32px', lineHeight: '1.2' }}>{countUpValues.properties}</p>
                </div>
                  <Home className="w-8 h-8 md:w-12 md:h-12 text-blue-500 opacity-20 flex-shrink-0 ml-2" />
              </div>
            </div>
            
            <div 
                className="bg-white p-4 md:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
                style={{ 
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => router.push('/maintenance')}
              >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" style={{ color: '#0A2540', opacity: 0.6 }} />
                      <p className="text-gray-900 font-bold" style={{ fontSize: '18px', lineHeight: '1.4' }}>
                        Upcoming Tasks
                      </p>
                    </div>
                    <p className="font-bold text-orange-600 mt-2" style={{ fontSize: '32px', lineHeight: '1.2' }}>{countUpValues.tasks}</p>
                  </div>
                  <Calendar className="w-8 h-8 md:w-12 md:h-12 text-orange-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>

              {/* Bottom Row */}
              <div 
                className="bg-white p-4 md:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
                style={{ 
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              onClick={() => router.push('/reports')}
            >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4" style={{ color: '#0A2540', opacity: 0.6 }} />
                      <p className="text-gray-900 font-bold" style={{ fontSize: '18px', lineHeight: '1.4' }}>
                        Monthly Rent
                      </p>
                </div>
                    <p className="font-bold text-green-600 mt-2" style={{ fontSize: '32px', lineHeight: '1.2' }}>${countUpValues.rent.toLocaleString()}</p>
                </div>
                  <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-green-500 opacity-20 flex-shrink-0 ml-2" />
              </div>
            </div>
            
            <div 
                className="bg-white p-4 md:p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px]"
                style={{ 
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              onClick={() => router.push('/expenses')}
            >
                <div className="flex items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4" style={{ color: '#0A2540', opacity: 0.6 }} />
                      <p className="text-gray-900 font-bold" style={{ fontSize: '18px', lineHeight: '1.4' }}>
                        This Month's Expenses
                      </p>
                </div>
                    <p className="font-bold text-red-600 mt-2" style={{ fontSize: '32px', lineHeight: '1.2' }}>${countUpValues.expenses.toLocaleString()}</p>
                </div>
                  <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-red-500 opacity-20 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>
            
            {/* Right Side: Rent Collection Status Chart */}
            {propertiesWithTenants.length > 0 && (
              <div 
                className="bg-white p-6 transition-all duration-200"
                style={{ 
                  borderRadius: '14px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
                }}
              >
                <RentCollectionStatusChart 
                  properties={properties}
                  rentPayments={allRentPayments}
                />
                </div>
            )}
              </div>

          {/* Divider */}
          <div style={{ 
            height: '2px',
            background: 'linear-gradient(to right, #E5E9E7, rgba(0,0,0,0))',
            margin: '16px 0'
          }}></div>

          {/* Cashflow Bar Chart */}
          <div 
            className="rounded-lg transition-all duration-200"
            style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(227, 232, 229, 0.5)',
              background: 'linear-gradient(180deg, #F9FCFB 0%, #F3FAF7 100%)'
            }}
          >
            <div className="p-6 border-b" style={{ borderColor: '#E5E9E7', borderBottomWidth: '1px' }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="mb-1" style={{ color: '#0A2540', fontWeight: 600, fontSize: '1.1rem' }}>Cashflow Summary</h2>
                  <p className="text-sm" style={{ color: '#667680', fontWeight: 400 }}>
                    Income vs Expenses ({getCashflowPeriodLabel()})
                  </p>
                </div>
                
                {/* Legend removed for cleaner design */}
                <div />
          </div>

              {/* Time Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {['all-time', 'this-month', 'last-month', 'last-quarter', 'last-year'].map((range) => {
                  const isActive = cashflowDateRange === range
                  const labelMap: Record<string, string> = {
                    'all-time': 'All Time',
                    'this-month': 'This Month',
                    'last-month': 'Last Month',
                    'last-quarter': 'Last Quarter',
                    'last-year': 'Last Year'
                  }
                  return (
                    <button
                      key={range}
                      onClick={(e) => {
                        setCashflowDateRange(range)
                        e.currentTarget.style.transform = 'scale(0.95)'
                        setTimeout(() => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }, 150)
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative"
                      style={{
                        backgroundColor: isActive ? '#1C7C63' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#0A2540',
                        border: `1px solid ${isActive ? '#1C7C63' : '#E5E9E7'}`,
                        opacity: isActive ? 1 : 0.8,
                        transform: 'scale(1)',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        paddingBottom: isActive ? '11px' : '8px',
                        boxShadow: isActive ? '0 0 12px rgba(28, 124, 99, 0.3)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#F7FBF9'
                          e.currentTarget.style.opacity = '1'
                        } else {
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(28, 124, 99, 0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.opacity = '0.8'
                        } else {
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(28, 124, 99, 0.3)'
                        }
                      }}
                    >
                      {labelMap[range]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-6">
              {!hasCashflowData ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ height: '480px' }}>
                      <div className="text-center">
                        <DollarSign className="w-16 h-16 mx-auto mb-4" style={{ color: '#1C7C63', opacity: 0.3 }} />
                        <h3 className="text-lg font-semibold mb-2" style={{ color: '#0A2540' }}>Track your first rent payment to see your cashflow grow</h3>
                        <p className="text-sm" style={{ color: '#0A2540', opacity: 0.6 }}>
                          Add properties and record rent payments to visualize your cashflow over time
                        </p>
                      </div>
                    </div>
                ) : (
                  <div style={{ height: '560px', paddingTop: '8px', paddingBottom: '12px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={cashflowDataMemo as any}
                        margin={{ top: 30, right: 30, left: 20, bottom: 45 }}
                        key={cashflowDateRange}
                        style={{ transition: 'all 0.3s ease' }}
                      >
                    <defs>
                      {/* Cashflow bar gradient - soft vertical gradient */}
                      <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1C7C63" stopOpacity={1} />
                        <stop offset="100%" stopColor="#A1E6C6" stopOpacity={1} />
                      </linearGradient>
                      {/* Expense bar gradient */}
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F7A43F" stopOpacity={1} />
                        <stop offset="100%" stopColor="#FCD07D" stopOpacity={1} />
                      </linearGradient>
                      {/* Cumulative line area gradient */}
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(28, 124, 99, 0.4)" stopOpacity={1} />
                        <stop offset="100%" stopColor="rgba(28, 124, 99, 0)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#E3E8E5"
                      strokeOpacity={0.1}
                      vertical={true}
                      horizontal={true}
                    />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(10, 37, 64, 0.7)', fontSize: 15 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      style={{ color: 'rgba(10, 37, 64, 0.7)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(10, 37, 64, 0.7)', fontSize: 15 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      width={80}
                      domain={['auto', 'auto']}
                      allowDataOverflow={false}
                      tickCount={5}
                    />
                    <Tooltip 
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload
                          const cumulativeValue = data.cumulativeCashflow || 0
                          return (
                            <div style={{ 
                              backgroundColor: '#F7FBFA',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid #D8EAE2',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                              fontSize: '0.9rem'
                            }}>
                              <div style={{ color: '#0A2540', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>
                                {label}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                                  <span style={{ color: '#0A2540', opacity: 0.7, fontSize: '0.85rem' }}>Income:</span>
                                  <span style={{ color: '#1C7C63', fontWeight: '600', fontSize: '0.85rem' }}>${(data.income || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                                  <span style={{ color: '#0A2540', opacity: 0.7, fontSize: '0.85rem' }}>Expenses:</span>
                                  <span style={{ color: '#FF7B00', fontWeight: '600', fontSize: '0.85rem' }}>${(data.expenses || 0).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #D8EAE2' }}>
                                  <span style={{ color: '#0A2540', fontWeight: 'bold', fontSize: '0.85rem' }}>Net:</span>
                                  <span style={{ color: (data.cashflow || 0) >= 0 ? '#1C7C63' : '#FF7B00', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    ${(data.cashflow || 0) >= 0 ? '+' : ''}${(data.cashflow || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid #D8EAE2' }}>
                                  <span style={{ color: '#0A2540', opacity: 0.7, fontSize: '0.85rem' }}>Cumulative:</span>
                                  <span style={{ color: '#1C7C63', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    ${cumulativeValue >= 0 ? '+' : ''}${cumulativeValue.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    {/* Cumulative cashflow line with gradient fill */}
                    <Area
                      type="monotone"
                      dataKey="cumulativeCashflow"
                      fill="url(#lineGradient)"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={700}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="cashflow" 
                      name="Cashflow (Income - Expenses)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={700}
                      animationEasing="ease-out"
                    >
                      {(cashflowDataMemo as any).map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.cashflow >= 0 ? 'url(#cashflowGradient)' : 'url(#expenseGradient)'}
                          style={{
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e: any) => {
                            if (entry.cashflow >= 0) {
                              e.currentTarget.style.opacity = '0.9'
                              e.currentTarget.style.transform = 'scaleY(1.02)'
                            }
                          }}
                          onMouseLeave={(e: any) => {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.transform = 'scaleY(1)'
                          }}
                        />
                      ))}
                      <LabelList 
                        dataKey="cashflow" 
                        position="top"
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                        style={{ 
                          fill: '#0A2540', 
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      />
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
                  </div>
                )}
              
              {/* Summary Stats */}
              {cashflowSummary ? (
                  <div className="mt-0 border-t" style={{ borderColor: '#E5E9E7', marginTop: '8px', marginBottom: '12px', paddingTop: '8px' }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm mb-2" style={{ color: '#7A8A8A' }}>
                          Net Cashflow ({cashflowPeriodLabel})
                        </p>
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-bold"
                            style={{ 
                              color: cashflowSummary.totalCashflow > 0 ? '#1C7C63' : '#EF4444', 
                              fontSize: '18px',
                              backgroundColor: cashflowSummary.totalCashflow > 0 ? 'rgba(28, 124, 99, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontWeight: 600
                            }}
                          >
                            {(cashflowSummary.totalCashflow > 0 ? '+' : '')}${cashflowSummary.totalCashflow.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {cashflowSummary.percentageChange !== null && cashflowSummary.percentageChange > 0 && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="px-4 py-2 rounded-lg flex items-center gap-2"
                            style={{ 
                              background: 'linear-gradient(90deg, #E8FFF5 0%, #F7FFFA 100%)',
                              color: '#1C7C63',
                              borderLeft: '4px solid #1C7C63',
                              fontWeight: 500
                            }}
                          >
                            <span className="text-base">🎉</span>
                            <span className="text-sm font-semibold">
                              {cashflowSummary.percentageChange > 1000 ? (
                                <>
                                  Great work — your cashflow is up {Math.abs(cashflowSummary.percentageChange / 100).toFixed(1)}x from last month!
                                </>
                              ) : cashflowSummary.percentageChange > 100 ? (
                                <>
                                  Cashflow up {Math.abs(cashflowSummary.percentageChange).toFixed(0)}% since last month — keep it growing!
                                </>
                              ) : (
                                <>
                                  Cashflow up {Math.abs(cashflowSummary.percentageChange).toFixed(0)}% from last month — great progress!
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  ) : null}
              </div>
            
            {/* Expenses Comparison Insight Banner */}
            {getExpensesComparison() && (
              <div 
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #E9FFF4, #F4FFFA)',
                  borderLeft: '4px solid #1C7C63',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                <p className="text-sm" style={{ color: '#1C7C63', fontWeight: 500 }}>
                  💡 Your expenses {getExpensesComparison()!.change > 0 ? 'increased' : 'decreased'} {Math.abs(getExpensesComparison()!.change)}% this month compared to {getExpensesComparison()!.lastMonthName}. {getExpensesComparison()!.change > 0 ? 'Check Reports for a breakdown.' : 'Great cost management!'}
                </p>
            </div>
            )}
            
            {/* Smart Insight Card */}
            {getRentCollectionPercentage() !== null && (
              <div 
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #E9FFF4, #F4FFFA)',
                  borderLeft: '4px solid #1C7C63',
                  borderRadius: '8px'
                }}
              >
                <p className="text-sm" style={{ color: '#1C7C63', fontWeight: 500 }}>
                  💡 You earned {getRentCollectionPercentage()}% of expected rent this month — {getRentCollectionPercentage()! >= 90 ? 'keep up the momentum!' : 'track progress in Reports.'}
                </p>
              </div>
            )}
          </div>

          {/* Divider before Charts */}
          <div style={{ 
            height: '1px',
            background: 'linear-gradient(to right, rgba(28,124,99,0.1), rgba(28,124,99,0))',
            margin: '24px 0',
            borderTop: '1px solid rgba(28,124,99,0.1)'
          }}></div>

          {/* Financial Overview Section Label */}
          <div style={{ marginBottom: '8px' }}>
            <h2 style={{ 
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#0A2540',
              marginBottom: '8px'
            }}>
              Financial Overview
            </h2>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#8DA6A0',
              fontWeight: 400,
              marginTop: '4px'
            }}>
              Income, expenses, and forecast performance
            </p>
            </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '24px' }}>
            {/* Expenses by Category Pie Chart */}
            <div 
              className="bg-white p-6 transition-all duration-200"
              style={{ 
                borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                background: 'linear-gradient(180deg, #F9FCFB 0%, #F3FAF7 100%)',
                opacity: 1,
                transform: 'translateY(0)',
                animation: 'fadeInUp 0.5s ease-out'
              }}
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b" style={{ borderColor: '#E5E9E7', borderBottomWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📊</span>
                  <h2 style={{ color: '#0A2540', fontWeight: 600, fontSize: '1.1rem' }}>Expenses by Category</h2>
                        </div>
                <div className="text-sm mt-1" style={{ color: '#8DA6A0', fontWeight: 400 }}>
                  Current: {getCurrentPieChartRangeLabel()}
                </div>
              </div>
              
              {/* Date Range Filter Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                        <button 
                  onClick={() => handlePieChartDateRange(null)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: !pieChartDateRange ? '#1C7C63' : 'transparent',
                    color: !pieChartDateRange ? '#FFFFFF' : '#0A2540',
                    border: `1px solid ${!pieChartDateRange ? '#1C7C63' : '#E5E9E7'}`,
                    opacity: !pieChartDateRange ? 1 : 0.8
                  }}
                  onMouseEnter={(e) => {
                    if (pieChartDateRange) {
                      e.currentTarget.style.backgroundColor = '#F7FBF9'
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pieChartDateRange) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.opacity = '0.8'
                    }
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
                      onClick={(e) => {
                        handlePieChartDateRange(range)
                        e.currentTarget.style.transform = 'scale(0.95)'
                        setTimeout(() => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }, 150)
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative"
                      style={{
                        backgroundColor: isActive ? '#1C7C63' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#0A2540',
                        border: `1px solid ${isActive ? '#1C7C63' : '#E5E9E7'}`,
                        opacity: isActive ? 1 : 0.8,
                        transform: 'scale(1)',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        paddingBottom: isActive ? '11px' : '8px',
                        boxShadow: isActive ? '0 0 12px rgba(28, 124, 99, 0.3)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#F7FBF9'
                          e.currentTarget.style.opacity = '1'
                        } else {
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(28, 124, 99, 0.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.opacity = '0.8'
                        } else {
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(28, 124, 99, 0.3)'
                        }
                      }}
                    >
                      {range}
                      {isActive && (
                        <div 
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '10%',
                            right: '10%',
                            height: '3px',
                            background: 'linear-gradient(90deg, #1C7C63, #5DD39E)',
                            borderRadius: '2px',
                            boxShadow: '0 0 8px rgba(93, 211, 158, 0.5)'
                          }}
                        />
                      )}
                    </button>
                  )
                })}
          </div>

              <div className="h-80" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.08))' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {categoryData.map((entry, index) => {
                        const baseColor = getCategoryColor(entry.name)
                        const gradientColors = getCategoryGradientColors(baseColor)
                        return (
                          <linearGradient key={`gradient-${index}`} id={`categoryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientColors.from} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={gradientColors.to} stopOpacity={0.6} />
                          </linearGradient>
                        )
                      })}
                    </defs>
                    <Pie
                      data={categoryData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="70%"
                      innerRadius="20%"
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={750}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, index) => {
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#categoryGradient-${index})`}
                            style={{
                              cursor: 'pointer',
                              transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e: any) => {
                              if (e.target) {
                                e.target.style.opacity = '1'
                                e.target.style.filter = 'brightness(1.1)'
                              }
                            }}
                            onMouseLeave={(e: any) => {
                              if (e.target) {
                                e.target.style.opacity = '0.9'
                                e.target.style.filter = 'brightness(1)'
                              }
                            }}
                          />
                        )
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #E5E9E7',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        paddingTop: '16px'
                      }}
                      iconType="circle"
                      formatter={(value, entry) => {
                        const total = categoryData.reduce((sum, item) => sum + item.value, 0)
                        const percentage = total > 0 ? ((entry.payload?.value || 0) / total * 100).toFixed(1) : '0.0'
                        return (
                          <span 
                            style={{
                              background: '#F9FCFB',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '0.85rem',
                              color: '#0A2540',
                              fontWeight: 500
                            }}
                          >
                            {value}: {percentage}%
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Flow Forecast Chart */}
            <div 
              className="bg-white p-6 transition-all duration-200"
              style={{ 
                borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                background: 'linear-gradient(180deg, #F9FCFB 0%, #F3FAF7 100%)',
                opacity: 1,
                transform: 'translateY(0)',
                animation: 'fadeInUp 0.5s ease-out 0.1s both'
              }}
            >
              <div className="mb-4 pb-4 border-b" style={{ borderColor: '#E5E9E7', borderBottomWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🧾</span>
                  <h2 style={{ color: '#0A2540', fontWeight: 600, fontSize: '1.1rem' }}>Cash Flow Forecast (Next 3 Months)</h2>
                </div>
                <p className="text-sm mt-1" style={{ color: '#8DA6A0', fontWeight: 400 }}>Projected income, expenses, and net cash flow</p>
              </div>
              
              <div className="h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowForecast}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(28, 124, 99, 0.25)" stopOpacity={1}/>
                        <stop offset="50%" stopColor="rgba(28, 124, 99, 0.15)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="rgba(28, 124, 99, 0)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(232, 104, 74, 0.25)" stopOpacity={1}/>
                        <stop offset="50%" stopColor="rgba(232, 104, 74, 0.15)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="rgba(232, 104, 74, 0)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(109, 200, 160, 0.15)" stopOpacity={1}/>
                        <stop offset="100%" stopColor="rgba(109, 200, 160, 0)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#E3E8E5" 
                      strokeOpacity={0.1}
                      vertical={true}
                      horizontal={true}
                    />
                    <XAxis 
                      dataKey="month"
                      tick={{ fill: 'rgba(10, 37, 64, 0.7)', fontSize: 15 }}
                      style={{ color: 'rgba(10, 37, 64, 0.7)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(10, 37, 64, 0.7)', fontSize: 15 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#1C7C63" 
                      strokeWidth={2.5}
                      fillOpacity={0.85} 
                      fill="url(#colorIncome)"
                      name="Projected Income"
                      dot={{ fill: '#1C7C63', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#E8684A" 
                      strokeWidth={2.5}
                      fillOpacity={0.85} 
                      fill="url(#colorExpenses)"
                      name="Projected Expenses"
                      dot={{ fill: '#E8684A', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="netCashFlow" 
                      stroke="#1C7C63" 
                      strokeWidth={2.5}
                      fillOpacity={0.6}
                      fill="url(#colorNet)"
                      dot={(props: any) => {
                        const { payload } = props
                        const isNegative = payload.netCashFlow < 0
                        return (
                          <circle 
                            cx={props.cx} 
                            cy={props.cy} 
                            r={5} 
                            fill={isNegative ? '#EF4444' : '#1C7C63'} 
                            stroke="#FFFFFF" 
                      strokeWidth={2}
                          />
                        )
                      }}
                      activeDot={{ r: 6 }}
                      name="Net Cash Flow"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Divider before Maintenance */}
          <div style={{ 
            height: '1px',
            background: 'linear-gradient(to right, rgba(28,124,99,0.1), rgba(28,124,99,0))',
            margin: '24px 0',
            borderTop: '1px solid rgba(28,124,99,0.1)'
          }}></div>

          {/* Upcoming Maintenance */}
          <div 
            className="bg-white transition-all duration-200"
            style={{ 
              borderRadius: '14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div 
              className="p-6 border-b" 
              style={{ 
                borderColor: '#E5E9E7', 
                borderBottomWidth: '1px',
                backgroundColor: '#F8FBFA'
              }}
            >
              <div className="flex items-center gap-1.5 mb-2.5" style={{ marginBottom: '10px' }}>
                <span className="text-lg">🔧</span>
                <h2 style={{ color: '#0A2540', fontWeight: 600, fontSize: '1.1rem' }}>Upcoming Maintenance</h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#8DA6A0', fontWeight: 400 }}>Track and manage repairs, upkeep, and maintenance tasks</p>
              {showOverdueBanner && overdueCount > 0 && (
                <div 
                  className="mt-4 p-3 rounded-md flex items-start justify-between"
                  style={{
                    background: 'linear-gradient(90deg, #FFEAEA, #FFD1C7)',
                    borderLeft: '4px solid #E04848'
                  }}
                >
                  <div style={{ color: '#7A1E1E' }}>
                    <strong style={{ color: '#7A1E1E' }}>{overdueCount}</strong> maintenance {overdueCount === 1 ? 'task is' : 'tasks are'} overdue. Please review.
                  </div>
                  <button
                    onClick={() => {
                      const todayKey = new Date().toISOString().slice(0, 10)
                      const storageKey = `overdue-banner-${todayKey}`
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(storageKey, '1')
                      }
                      setShowOverdueBanner(false)
                    }}
                    className="ml-4 px-3 py-1 rounded-md text-sm"
                    style={{ background: '#7A1E1E', color: '#FFFFFF', fontWeight: 600 }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              {maintenance.filter(m => m.status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming maintenance tasks</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '12px' }}>
                  {maintenance
                    .filter(m => m.status === 'pending')
                    .sort((a, b) => {
                      // Priority: Overdue (2) > Due soon (1) > Pending (0)
                      const priority = (t: MaintenanceTask) => (isOverdue(t) ? 2 : isDueSoon(t) ? 1 : 0)
                      const prioDiff = priority(b) - priority(a)
                      if (prioDiff !== 0) return prioDiff
                      // Then by nearest due date (earliest first)
                      const aDate = new Date(a.due_date + 'T00:00:00').getTime()
                      const bDate = new Date(b.due_date + 'T00:00:00').getTime()
                      return aDate - bDate
                    })
                    .map(task => {
                    const property = properties.find(p => p.id === task.property_id)
                    const taskIcon = task.task.toLowerCase().includes('plumb') || task.task.toLowerCase().includes('pipe') ? '🚰' : 
                                    task.task.toLowerCase().includes('hvac') || task.task.toLowerCase().includes('heat') || task.task.toLowerCase().includes('air') ? '❄️' :
                                    task.task.toLowerCase().includes('electr') ? '⚡' : '🛠️'
                    
                    const taskOverdue = isOverdue(task)
                    const taskDueSoon = isDueSoon(task)
                    
                    // Determine border color based on status
                    const getBorderColor = () => {
                      if (taskOverdue) return '#E04848'
                      if (task.status === 'pending') return '#F7C948'
                      return '#1C7C63'
                    }

                    // Determine priority color
                    const getPriorityColor = (priority?: string) => {
                      if (priority === 'high') return { bg: '#FFEAEA', text: '#E04848' }
                      if (priority === 'medium') return { bg: '#FFF7E0', text: '#D97706' }
                      return { bg: '#E7F2EF', text: '#1C7C63' }
                    }

                    const priorityColor = getPriorityColor(task.priority)

                    return (
                      <div 
                        key={task.id} 
                        className="border rounded-lg p-4 flex flex-col cursor-pointer transition-all duration-200"
                        style={{
                          borderRadius: '12px',
                          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)',
                          borderLeft: '3px solid',
                          borderImage: 'linear-gradient(180deg, #1C7C63, #5DD39E) 1',
                          borderTop: '1px solid #E5E9E7',
                          borderRight: '1px solid #E5E9E7',
                          borderBottom: '1px solid #E5E9E7',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          transform: 'translateY(0)',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                        onClick={() => router.push('/maintenance')}
                      >
                        {/* Task Title */}
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-xl">{taskIcon}</span>
                          <h3 className="font-semibold text-gray-800 flex-1" style={{ fontWeight: 600, fontSize: '16px' }}>{task.task}</h3>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-3">
                          {taskOverdue ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                background: '#E04848',
                                color: '#FFFFFF',
                                fontWeight: 700 
                              }}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          ) : taskDueSoon ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                background: 'linear-gradient(90deg, #FFE5E1 0%, #FFD1C7 100%)', 
                                color: '#C0362C', 
                                fontWeight: 500 
                              }}
                            >
                              <AlertCircle className="w-3 h-3" />
                              Due Soon
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                background: 'linear-gradient(90deg, #FFF8E1 0%, #FFF2C2 100%)', 
                                color: '#A97900', 
                                fontWeight: 500 
                              }}
                            >
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Property Address */}
                        {property && (
                          <div className="flex items-center gap-2 mb-2" style={{ color: '#647474', fontSize: '14px' }}>
                            <span>📍</span>
                            <span>{property.nickname || property.address}</span>
                          </div>
                        )}

                        {/* Scheduled Date */}
                        <div className="flex items-center gap-2 mb-4" style={{ color: taskOverdue ? '#B0372A' : '#647474', fontSize: '14px' }}>
                          <span>🗓</span>
                          <span>
                            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Mark Complete Button - Right Aligned */}
                        <div className="flex justify-end mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTask(task)
                              setShowCostModal(true)
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                            style={{
                              background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                              color: 'white',
                              border: 'none',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.05)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1)'
                            }}
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false })
