'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getExpenses, deleteExpense, updateExpense, getProperties, getMaintenanceTasks } from '@/lib/database'
import { Expense, Property, MaintenanceTask } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import FileUpload from '@/components/FileUpload'
import DateRangeFilter from '@/components/DateRangeFilter'
import ExportButtons from '@/components/ExportButtons'
import { uploadFile } from '@/lib/storage'
import { Plus, Trash2, Download, Eye, Edit, DollarSign, Home, Calendar, FileText, Filter, MoreVertical, Tag, Receipt, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const EXPENSE_CATEGORIES = [
  'Repairs',
  'Utilities',
  'Insurance',
  'Property Tax',
  'HOA Fees',
  'Lawn Care',
  'Pest Control',
  'Legal Fees',
  'Other'
]

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [newExpense, setNewExpense] = useState({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Repairs',
    description: '',
    is_recurring: false,
    recurring_frequency: 'monthly'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'property' | 'category' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [activeFilter, setActiveFilter] = useState<'all' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'custom' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      const [expensesData, propertiesData, maintenanceData] = await Promise.all([
        getExpenses(user!.id),
        getProperties(user!.id),
        getMaintenanceTasks(user!.id)
      ])
      setExpenses(expensesData)
      setProperties(propertiesData)
      setMaintenanceTasks(maintenanceData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      try {
        await deleteExpense(id)
        setExpenses(expenses.filter(expense => expense.id !== id))
      } catch (error) {
        console.error('Error deleting expense:', error)
        alert('Failed to delete expense')
      }
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setNewExpense({
      property_id: expense.property_id,
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      is_recurring: expense.is_recurring || false,
      recurring_frequency: expense.recurring_frequency || 'monthly'
    })
    setSelectedFile(null)
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense || !newExpense.property_id || !newExpense.amount || !newExpense.date) {
      alert('Please fill in all required fields')
      return
    }
    
    setUploading(true)
    
    try {
      let receiptUrl = editingExpense.receipt_url
      
      // Upload new file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile, user!.id, 'receipts')
        if (!uploadResult.success) {
          alert(`Upload failed: ${uploadResult.error}`)
          setUploading(false)
          return
        }
        receiptUrl = uploadResult.url
      }
      
      const updatedExpense = await updateExpense(editingExpense.id, {
        property_id: newExpense.property_id,
        date: newExpense.date,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description || undefined,
        receipt_url: receiptUrl || undefined,
        is_recurring: newExpense.is_recurring,
        recurring_frequency: newExpense.is_recurring ? newExpense.recurring_frequency : undefined,
      })
      
      // Create document record if new receipt was uploaded
      if (selectedFile && receiptUrl) {
        try {
          console.log('Creating document record for receipt...')
          const { createDocument } = await import('@/lib/database')
          await createDocument({
            user_id: user!.id,
            property_id: newExpense.property_id,
            name: selectedFile.name,
            type: 'Receipt',
            file_url: receiptUrl,
            upload_date: new Date().toISOString()
          })
          console.log('Document record created for updated receipt')
        } catch (docError) {
          console.error('Error creating document record:', docError)
          alert(`Warning: Expense updated but document record creation failed: ${docError}`)
          // Don't fail the expense update if document creation fails
        }
      }

      setExpenses(expenses.map(expense => 
        expense.id === editingExpense.id ? updatedExpense : expense
      ))
      setEditingExpense(null)
      setNewExpense({ property_id: '', date: new Date().toISOString().split('T')[0], amount: '', category: 'Repairs', description: '', is_recurring: false, recurring_frequency: 'monthly' })
      setSelectedFile(null)
    } catch (error) {
      console.error('Error updating expense:', error)
      alert(`Failed to update expense: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  const addExpense = async () => {
    if (!newExpense.property_id || !newExpense.amount || !newExpense.date) {
      alert('Please fill in all required fields')
      return
    }
    
    setUploading(true)
    
    try {
      let receiptUrl = null
      
      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile, user!.id, 'receipts')
        if (!uploadResult.success) {
          alert(`Upload failed: ${uploadResult.error}`)
          setUploading(false)
          return
        }
        receiptUrl = uploadResult.url
      }
      
      const { createExpense } = await import('@/lib/database')
      const expense = await createExpense({
        user_id: user!.id,
        property_id: newExpense.property_id,
        date: newExpense.date,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description || undefined,
        receipt_url: receiptUrl || undefined,
        is_recurring: newExpense.is_recurring,
        recurring_frequency: newExpense.is_recurring ? newExpense.recurring_frequency : undefined,
      })
      
      // Create document record if receipt was uploaded
      if (selectedFile && receiptUrl) {
        try {
          const { createDocument } = await import('@/lib/database')
          await createDocument({
            user_id: user!.id,
            property_id: newExpense.property_id,
            name: selectedFile.name,
            type: 'Receipt',
            file_url: receiptUrl,
            upload_date: new Date().toISOString()
          })
          console.log('Document record created for receipt')
        } catch (docError) {
          console.error('Error creating document record:', docError)
          // Don't fail the expense creation if document creation fails
        }
      }

      setExpenses([...expenses, expense])
      setNewExpense({ property_id: '', date: new Date().toISOString().split('T')[0], amount: '', category: 'Repairs', description: '', is_recurring: false, recurring_frequency: 'monthly' })
      setSelectedFile(null)
      setShowAddExpense(false)
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense')
    } finally {
      setUploading(false)
    }
  }

  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    return property ? property.address : 'Unknown Property'
  }

  const handleSort = (field: 'date' | 'property' | 'category' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'date' | 'property' | 'category' | 'amount') => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const getFilteredExpenses = () => {
    let filtered = expenses
    
    // Apply date range filter
    if (dateRange) {
      filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return expenseDate >= startDate && expenseDate <= endDate
      })
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'property':
          aValue = getPropertyAddress(a.property_id)
          bValue = getPropertyAddress(b.property_id)
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Get category color for pills
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, { bg: string; text: string }> = {
      'Property Tax': { bg: '#E7F2EF', text: '#0A2540' },
      'Insurance': { bg: '#E7F2EF', text: '#1C7C63' },
      'Lawn Care': { bg: '#E7F2EF', text: '#1C7C63' },
      'Repairs': { bg: '#FFF3E6', text: '#FF7B00' },
      'Utilities': { bg: '#E7F2EF', text: '#1C7C63' },
      'HOA Fees': { bg: '#E7F2EF', text: '#1C7C63' },
      'Pest Control': { bg: '#FFF3E6', text: '#FF7B00' },
      'Legal Fees': { bg: '#E7F2EF', text: '#1C7C63' },
      'Other': { bg: '#F8FAF9', text: '#667680' }
    }
    return categoryColors[category] || { bg: '#F8FAF9', text: '#667680' }
  }

  // Calculate category breakdown for pie chart
  const getCategoryData = () => {
    const filtered = getFilteredExpenses()
    const categoryMap = new Map<string, number>()
    
    filtered.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0
      categoryMap.set(expense.category, current + expense.amount)
    })
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    })).sort((a, b) => b.value - a.value)
  }

  // Helper function to get month key (YYYY-MM) using local time
  const getMonthKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  // Calculate monthly expense trend for bar chart
  const getMonthlyExpenseData = () => {
    const filtered = getFilteredExpenses()
    const monthlyMap = new Map<string, number>()
    
    filtered.forEach(expense => {
      // Parse date string directly to avoid timezone issues
      const [year, month, day] = expense.date.split('-').map(Number)
      const expenseDate = new Date(year, month - 1, day)
      const monthKey = getMonthKey(expenseDate) // Use local time
      const current = monthlyMap.get(monthKey) || 0
      monthlyMap.set(monthKey, current + expense.amount)
    })
    
    // Convert to array and sort by month key (which sorts chronologically)
    return Array.from(monthlyMap.entries())
      .map(([monthKey, value]) => {
        // Parse month key to create date for formatting
        const [year, month] = monthKey.split('-').map(Number)
        const monthDate = new Date(year, month - 1, 1)
        return {
          monthKey, // Keep for sorting
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: Math.round(value * 100) / 100
        }
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)) // Sort by month key (YYYY-MM)
      .slice(-6) // Last 6 months
      .map(({ month, amount }) => ({ month, amount })) // Remove monthKey from final output
  }

  // Get time frame label
  const getTimeFrameLabel = () => {
    if (dateRange) {
      return `${dateRange.start} to ${dateRange.end}`
    }
    return 'All Time'
  }

  // Calculate totals
  const getTotalExpenses = () => {
    return getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0)
  }

  // Get unique properties count from filtered expenses
  const getUniquePropertiesCount = () => {
    const filtered = getFilteredExpenses()
    const uniqueProperties = new Set(filtered.map(e => e.property_id))
    return uniqueProperties.size
  }

  // Chart colors with gradient definitions
  const CHART_COLORS = ['#1C7C63', '#FF7B00', '#0A2540', '#E7F2EF', '#10b981', '#F6BD16', '#5B8FF9', '#06b6d4', '#6DC8A0', '#f97316', '#ec4899']
  
  // Gradient color definitions for pie chart (desaturated hues)
  const getGradientColors = (baseColor: string) => {
    const gradientMap: Record<string, { from: string; to: string }> = {
      '#1C7C63': { from: '#1C7C63', to: '#A7D6C9' }, // Teal
      '#FF7B00': { from: '#FF7B00', to: '#FFD4A3' }, // Orange
      '#0A2540': { from: '#0A2540', to: '#7A9BC0' }, // Navy
      '#E7F2EF': { from: '#E7F2EF', to: '#F0F8F6' }, // Light teal
      '#10b981': { from: '#10b981', to: '#86EFAC' }, // Green
      '#F6BD16': { from: '#F6BD16', to: '#FDE68A' }, // Yellow
      '#5B8FF9': { from: '#5B8FF9', to: '#A5C9FF' }, // Blue
      '#06b6d4': { from: '#06b6d4', to: '#67E8F9' }, // Cyan
      '#6DC8A0': { from: '#6DC8A0', to: '#B4E6D0' }, // Mint
      '#f97316': { from: '#f97316', to: '#FED7AA' }, // Orange
      '#ec4899': { from: '#ec4899', to: '#F9A8D4' } // Pink
    }
    return gradientMap[baseColor] || { from: baseColor, to: baseColor }
  }
  
  // Get top spending category for insights
  const getTopSpendingCategory = () => {
    const categoryData = getCategoryData()
    if (categoryData.length === 0) return null
    return categoryData[0] // Already sorted by value descending
  }

  // Calculate monthly comparison
  const getMonthlyComparison = () => {
    const filtered = getFilteredExpenses()
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0)
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0)
    
    const currentMonthExpenses = filtered
      .filter(e => {
        // Parse date string directly to avoid timezone issues
        const [year, month, day] = e.date.split('-').map(Number)
        const expenseDate = new Date(year, month - 1, day)
        return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd
      })
      .reduce((sum, e) => sum + e.amount, 0)
    
    const lastMonthExpenses = filtered
      .filter(e => {
        // Parse date string directly to avoid timezone issues
        const [year, month, day] = e.date.split('-').map(Number)
        const expenseDate = new Date(year, month - 1, day)
        return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd
      })
      .reduce((sum, e) => sum + e.amount, 0)
    
    if (lastMonthExpenses === 0) return null
    
    const change = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    return {
      change: Math.round(change),
      current: currentMonthExpenses,
      last: lastMonthExpenses
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

  const renderExpenseForm = () => (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newExpense.property_id}
                    onChange={(e) => setNewExpense({ ...newExpense, property_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                  >
                    {EXPENSE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                    placeholder="Plumbing repair - kitchen sink"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newExpense.is_recurring}
                        onChange={(e) => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Recurring Expense</span>
                    </label>
                    {newExpense.is_recurring && (
                      <select
                        value={newExpense.recurring_frequency}
                        onChange={(e) => setNewExpense({ ...newExpense, recurring_frequency: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (Optional)</label>
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                    selectedFile={selectedFile}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5 * 1024 * 1024}
                    disabled={uploading}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingExpense ? handleUpdateExpense : addExpense}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
                </button>
                <button
                  onClick={() => {
                    setShowAddExpense(false)
                    setEditingExpense(null)
                    setNewExpense({ property_id: '', date: new Date().toISOString().split('T')[0], amount: '', category: 'Repairs', description: '', is_recurring: false, recurring_frequency: 'monthly' })
                    setSelectedFile(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
  )

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
            <button
              onClick={() => setShowAddExpense(true)}
              className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              style={{
                backgroundColor: '#1C7C63',
                border: 'none',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#29A184'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1C7C63'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>

          {/* Show form right after header for both mobile and desktop */}
          {(showAddExpense || editingExpense) && renderExpenseForm()}

          {/* Financial Overview Section */}
          <div 
            className="mb-6 p-6 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
              padding: '1rem 1.5rem'
            }}
          >
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#0A2540', fontWeight: 600 }}>Financial Overview</h2>
            
            {/* Monthly Comparison Banner */}
            {getMonthlyComparison() && (
              <div 
                className="mb-4 p-3 rounded-lg transition-all duration-200"
                style={{
                  background: getMonthlyComparison()!.change > 0 
                    ? 'linear-gradient(90deg, #FFF4E5, #FFF9ED)' 
                    : 'linear-gradient(90deg, #E6F5EA, #F0F8F6)',
                  borderLeft: `4px solid ${getMonthlyComparison()!.change > 0 ? '#FFA500' : '#1C7C63'}`,
                  borderRadius: '8px'
                }}
              >
                <p className="text-sm" style={{ color: '#0A2540' }}>
                  <span style={{ fontWeight: 600 }}>
                    Expenses {getMonthlyComparison()!.change > 0 ? 'up' : 'down'} {Math.abs(getMonthlyComparison()!.change)}%
                  </span>
                  {' vs last month'} — track your trend in{' '}
                  <a 
                    href="/reports" 
                    className="underline relative" 
                    style={{ 
                      color: '#1C7C63',
                      borderBottom: '2px solid #1C7C63',
                      paddingBottom: '1px'
                    }}
                  >
                    Reports
                  </a>.
                </p>
            </div>
          )}

            {/* Quick Summary Stats */}
            <div 
              className="p-4 transition-all duration-200"
              style={{ 
                backgroundColor: '#F8FAF9',
                borderRadius: '8px',
                border: '1px solid #E5E9E7'
              }}
            >
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className="text-sm font-medium text-gray-900">Total Expenses:</span>
                  <span className="text-lg font-bold" style={{ color: '#1C7C63', fontWeight: 700 }}>${getTotalExpenses().toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  <span className="text-sm font-medium text-gray-900">Properties:</span>
                  <span className="text-lg font-bold" style={{ color: '#1C7C63', fontWeight: 700 }}>{getUniquePropertiesCount()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕒</span>
                  <span className="text-sm font-medium text-gray-900">Time Frame:</span>
                  <span className="text-lg font-bold" style={{ color: '#1C7C63', fontWeight: 700 }}>{getTimeFrameLabel()}</span>
                </div>
              </div>
              
              {/* Insights Tag */}
              {getTopSpendingCategory() && (
                <div 
                  className="mt-4 pt-4 border-t flex items-center gap-2"
                  style={{ 
                    borderColor: '#E5E9E7'
                  }}
                >
                  <span className="text-lg">💡</span>
                  <p className="text-sm" style={{ color: '#0A2540' }}>
                    You spent most on <strong>{getTopSpendingCategory()!.name}</strong> this {activeFilter === 'this-month' ? 'month' : activeFilter === 'this-year' ? 'year' : activeFilter === 'this-quarter' ? 'quarter' : 'period'}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Breakdown Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#0A2540', fontWeight: 600 }}>Expense Breakdown</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Category Breakdown */}
              <div 
                className="bg-white rounded-lg shadow p-6 transition-all duration-200"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
                }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>Expenses by Category</h3>
                {getCategoryData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {getCategoryData().map((entry, index) => {
                          const baseColor = CHART_COLORS[index % CHART_COLORS.length]
                          const gradientColors = getGradientColors(baseColor)
                          return (
                            <linearGradient 
                              key={`gradient-${index}`} 
                              id={`gradient-${index}`} 
                              x1="0" 
                              y1="0" 
                              x2="0" 
                              y2="1"
                            >
                              <stop offset="0%" stopColor={gradientColors.from} stopOpacity={0.9} />
                              <stop offset="50%" stopColor={gradientColors.from} stopOpacity={0.6} />
                              <stop offset="100%" stopColor={gradientColors.to} stopOpacity={0.4} />
                            </linearGradient>
                          )
                        })}
                      </defs>
                      <Pie
                        data={getCategoryData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={750}
                      >
                        {getCategoryData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#gradient-${index})`}
                            style={{
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e: any) => {
                              if (e.target) {
                                e.target.style.transform = 'scale(1.05)'
                              }
                            }}
                            onMouseLeave={(e: any) => {
                              if (e.target) {
                                e.target.style.transform = 'scale(1)'
                              }
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={80}
                        wrapperStyle={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          paddingTop: '16px',
                          paddingLeft: '4px',
                          paddingRight: '4px',
                          maxWidth: '100%',
                          fontSize: '12px'
                        }}
                        iconType="circle"
                        formatter={(value, entry) => {
                          const total = getCategoryData().reduce((sum, item) => sum + item.value, 0)
                          const item = getCategoryData().find((item) => item.name === value)
                          const percentage = total > 0 && item ? ((item.value / total) * 100).toFixed(0) : '0'
                          return (
                            <span 
                              style={{
                                background: '#F9FCFB',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: '#0A2540',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}
                            >
                              {value}: {percentage}%
                            </span>
                          )
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No expenses to display</p>
                )}
              </div>

              {/* Bar Chart - Monthly Trend */}
              <div 
                className="bg-white rounded-lg shadow transition-all duration-300"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
                  opacity: 1,
                  transform: 'translateY(0)',
                  padding: '1rem',
                  paddingBottom: '1rem'
                }}
                key={`bar-${activeFilter}-${dateRange?.start}-${dateRange?.end}`}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>Monthly Expense Trend</h3>
                {getMonthlyExpenseData().length > 0 ? (
                  <div style={{ width: '100%', overflow: 'visible', paddingLeft: '0', paddingRight: '0' }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={getMonthlyExpenseData()}
                        margin={{ top: 20, right: 15, left: 5, bottom: 50 }}
                        barCategoryGap="20%"
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(28,124,99,0.8)" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="rgba(28,124,99,0.2)" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7ECEA" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#667680"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 12 }}
                          interval={0}
                          tickMargin={5}
                        />
                        <YAxis 
                          stroke="#667680"
                          width={50}
                          tick={{ fontSize: 11 }}
                          tickMargin={5}
                          tickFormatter={(value) => {
                            if (Math.abs(value) >= 1000) {
                              return `$${(value / 1000).toFixed(1)}k`
                            }
                            return `$${value}`
                          }}
                          domain={['auto', 'auto']}
                        />
                      <Tooltip 
                        formatter={(value: any) => `$${value.toFixed(2)}`}
                        labelFormatter={(label) => label}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="url(#barGradient)" 
                        radius={[6, 6, 0, 0]}
                        animationBegin={0}
                        animationDuration={750}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e: any) => {
                          if (e.target) {
                            e.target.style.transform = 'scale(1.03)'
                            e.target.style.filter = 'brightness(1.1)'
                          }
                        }}
                        onMouseLeave={(e: any) => {
                          if (e.target) {
                            e.target.style.transform = 'scale(1)'
                            e.target.style.filter = 'brightness(1)'
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No expenses to display</p>
                )}
              </div>
            </div>
          </div>

          {/* Filter and Export Section */}
          <div className="mb-6">
            <div 
              className="bg-white rounded-lg shadow p-6 transition-all duration-200"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" style={{ color: '#1C7C63' }} />
                  <h3 className="text-sm font-medium text-gray-900" style={{ fontWeight: 600 }}>Filter Expenses</h3>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: '#1C7C63' }} />
                  <h3 className="text-sm font-medium text-gray-900" style={{ fontWeight: 600 }}>Export</h3>
                </div>
              </div>
              
              {/* Merged Filter Bar */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'All Time', value: 'all' as const },
                  { label: 'This Month', value: 'this-month' as const },
                  { label: 'Last Month', value: 'last-month' as const },
                  { label: 'This Quarter', value: 'this-quarter' as const },
                  { label: 'This Year', value: 'this-year' as const },
                  { label: 'Custom Range', value: 'custom' as const }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      if (filter.value === 'custom') {
                        // Custom range will be handled by DateRangeFilter
                        setActiveFilter('custom')
                        return
                      }
                      setIsAnimating(true)
                      setActiveFilter(filter.value)
                      const now = new Date()
                      // Helper function to format date as YYYY-MM-DD using local time
                      const formatLocalDate = (date: Date): string => {
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        return `${year}-${month}-${day}`
                      }
                      
                      if (filter.value === 'all') {
                        setDateRange(null)
                      } else if (filter.value === 'this-month') {
                        const start = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
                        const end = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
                        setDateRange({ start, end })
                      } else if (filter.value === 'last-month') {
                        const start = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
                        const end = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
                        setDateRange({ start, end })
                      } else if (filter.value === 'this-quarter') {
                        const quarter = Math.floor(now.getMonth() / 3)
                        const start = formatLocalDate(new Date(now.getFullYear(), quarter * 3, 1))
                        const end = formatLocalDate(new Date(now.getFullYear(), (quarter + 1) * 3, 0))
                        setDateRange({ start, end })
                      } else if (filter.value === 'this-year') {
                        const start = formatLocalDate(new Date(now.getFullYear(), 0, 1))
                        const end = formatLocalDate(new Date(now.getFullYear(), 11, 31))
                        setDateRange({ start, end })
                      }
                      
                      // Reset animation after transition
                      setTimeout(() => setIsAnimating(false), 300)
                    }}
                    className="px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium"
                    style={{
                      backgroundColor: activeFilter === filter.value ? '#1C7C63' : 'transparent',
                      color: activeFilter === filter.value ? 'white' : '#667680',
                      border: `1px solid ${activeFilter === filter.value ? '#1C7C63' : '#D7E2DF'}`,
                      borderRadius: '6px',
                      fontWeight: activeFilter === filter.value ? 500 : 400
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Date Range */}
              {(activeFilter === 'custom' || (dateRange && activeFilter !== 'all' && activeFilter !== 'this-month' && activeFilter !== 'last-month' && activeFilter !== 'this-quarter' && activeFilter !== 'this-year' && activeFilter !== null)) && (
                <div className="mb-4">
                  <DateRangeFilter 
                    onDateRangeChange={(range) => {
                      setDateRange(range)
                      if (range) {
                        setActiveFilter('custom')
                      }
                    }}
                    selectedRange={dateRange}
                  />
                </div>
              )}
              
              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2">
                <ExportButtons 
                  expenses={expenses}
                  properties={properties}
                  maintenanceTasks={maintenanceTasks}
                  dateRange={dateRange}
                />
              </div>
              
              {/* Summary Stats */}
              <div className="text-xs text-gray-500 mt-4 pt-4 border-t" style={{ borderColor: '#E5E9E7' }}>
                {getFilteredExpenses().length} Expenses · {getUniquePropertiesCount()} Properties · {maintenanceTasks.filter(t => t.status === 'pending').length} Tasks
              </div>
            </div>
          </div>

          {/* Expense Records Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#0A2540', fontWeight: 600 }}>Expense Records</h2>
            <div 
              className="bg-white rounded-lg shadow overflow-hidden transition-all duration-200"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
              }}
            >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900" style={{ fontWeight: 600, color: '#0A2540' }}>
                  Expenses {dateRange ? `(${dateRange.start} to ${dateRange.end})` : '(All Time)'}
                </h3>
                <div className="text-sm text-gray-500">
                  {getFilteredExpenses().length} of {expenses.length} expenses
                </div>
              </div>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {getFilteredExpenses().map(expense => {
                const categoryColor = getCategoryColor(expense.category)
                return (
                  <div 
                    key={expense.id} 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-150"
                    style={{
                      borderRadius: '12px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-900" style={{ color: '#0A2540' }}>${expense.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{expense.date}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit expense"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Property:</span>
                        <span className="ml-2 text-sm text-gray-900">{getPropertyAddress(expense.property_id)}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Category:</span>
                        <span 
                          className="ml-2 inline-block px-2 py-1 rounded"
                          style={{
                            backgroundColor: categoryColor.bg,
                            color: categoryColor.text,
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px'
                          }}
                        >
                          {expense.category}
                        </span>
                        {expense.is_recurring && (
                          <span 
                            className="ml-2 inline-block px-2 py-1 rounded"
                            style={{
                              backgroundColor: '#FFF3E6',
                              color: '#FF7B00',
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '6px'
                            }}
                          >
                            {expense.recurring_frequency}
                          </span>
                        )}
                      </div>
                      {expense.description && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Description:</span>
                          <span className="ml-2 text-sm text-gray-900">{expense.description}</span>
                        </div>
                      )}
                      {expense.receipt_url && (
                        <div className="flex items-center space-x-3 pt-2">
                          <span className="text-xs font-medium text-gray-500">Receipt:</span>
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </a>
                          <a
                            href={expense.receipt_url}
                            download
                            className="text-green-600 hover:text-green-800 flex items-center space-x-1 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Download</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {/* Mobile Totals */}
              {getFilteredExpenses().length > 0 && (
                <div 
                  className="rounded-lg p-4 border font-semibold" 
                  style={{ 
                    backgroundColor: '#F3FAF7',
                    borderColor: '#E5E9E7',
                    borderRadius: '12px' 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ fontWeight: 600, color: '#1C7C63' }}>TOTAL</span>
                    <span className="text-lg font-bold" style={{ color: '#1C7C63' }}>${getTotalExpenses().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left uppercase cursor-pointer select-none transition-all duration-200"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                    onClick={() => handleSort('date')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAF9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  >
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>Date</span>
                      <span className="text-sm">{getSortIcon('date')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase cursor-pointer select-none transition-all duration-200"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                    onClick={() => handleSort('property')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAF9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🏠</span>
                      <span>Property</span>
                      <span className="text-sm">{getSortIcon('property')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase cursor-pointer select-none transition-all duration-200"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                    onClick={() => handleSort('category')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAF9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🏷️</span>
                      <span>Category</span>
                      <span className="text-sm">{getSortIcon('category')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                  >
                    Description
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase cursor-pointer select-none transition-all duration-200"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                    onClick={() => handleSort('amount')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAF9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  >
                    <div className="flex items-center space-x-2">
                      <span>💵</span>
                      <span>Amount</span>
                      <span className="text-sm">{getSortIcon('amount')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                  >
                    Receipt
                  </th>
                  <th 
                    className="px-6 py-3 text-left uppercase"
                    style={{
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0A2540'
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredExpenses().map(expense => {
                  const categoryColor = getCategoryColor(expense.category)
                  return (
                    <tr 
                      key={expense.id} 
                      className="transition-all duration-200"
                      style={{
                        backgroundColor: 'white',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #F9FCFB, #F3FAF7)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getPropertyAddress(expense.property_id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span 
                            className="inline-block px-2 py-1 rounded"
                            style={{
                              backgroundColor: categoryColor.bg,
                              color: categoryColor.text,
                              fontSize: '12px',
                              fontWeight: 500,
                              borderRadius: '6px'
                            }}
                          >
                            {expense.category}
                          </span>
                        {expense.is_recurring && (
                            <span 
                              className="inline-block px-2 py-1 rounded"
                              style={{
                                backgroundColor: '#FFF3E6',
                                color: '#FF7B00',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '6px'
                              }}
                            >
                            {expense.recurring_frequency}
                          </span>
                        )}
                      </div>
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{expense.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.receipt_url ? (
                        <div className="flex space-x-2">
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={expense.receipt_url}
                            download
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Download receipt"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <span 
                          className="text-gray-400 cursor-pointer transition-colors hover:text-gray-600"
                          title="Click to upload receipt"
                        >
                          🧾
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800 transition-all duration-200"
                          title="Edit expense"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 transition-all duration-200"
                          title="Delete expense"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative inline-block">
                          <button
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="More actions"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Future: Open dropdown menu
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {/* Totals Row */}
                {getFilteredExpenses().length > 0 && (
                  <tr style={{ 
                    background: 'linear-gradient(90deg, #E7F2EF, #F8FAF9)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <td colSpan={4} className="px-6 py-4 text-sm" style={{ fontWeight: 600, color: '#1C7C63' }}>
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: '#1C7C63' }}>
                      ${getTotalExpenses().toFixed(2)}
                    </td>
                    <td colSpan={2} className="px-6 py-4"></td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
