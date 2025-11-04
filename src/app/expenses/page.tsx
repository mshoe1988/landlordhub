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
import { Plus, Trash2, Download, Eye, Edit, DollarSign, Home, Calendar, FileText, Filter } from 'lucide-react'
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'this-month' | 'last-month' | 'this-year' | null>(null)

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

  // Calculate monthly expense trend for bar chart
  const getMonthlyExpenseData = () => {
    const filtered = getFilteredExpenses()
    const monthlyMap = new Map<string, number>()
    
    filtered.forEach(expense => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const current = monthlyMap.get(monthKey) || 0
      monthlyMap.set(monthKey, current + expense.amount)
    })
    
    return Array.from(monthlyMap.entries())
      .map(([month, value]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: Math.round(value * 100) / 100
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6) // Last 6 months
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

  // Chart colors
  const CHART_COLORS = ['#1C7C63', '#FF7B00', '#0A2540', '#E7F2EF', '#10b981', '#F6BD16', '#5B8FF9', '#06b6d4', '#6DC8A0', '#f97316', '#ec4899']

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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>

          {/* Show form right after header for both mobile and desktop */}
          {(showAddExpense || editingExpense) && renderExpenseForm()}

          {/* Quick Summary Stats */}
          <div 
            className="bg-white rounded-lg shadow p-4 mb-6 transition-all duration-200"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" style={{ color: '#1C7C63' }} />
                <span className="text-sm font-medium text-gray-900">Total Expenses:</span>
                <span className="text-lg font-bold" style={{ color: '#1C7C63' }}>${getTotalExpenses().toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" style={{ color: '#1C7C63' }} />
                <span className="text-sm font-medium text-gray-900">Properties:</span>
                <span className="text-lg font-bold" style={{ color: '#1C7C63' }}>{getUniquePropertiesCount()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: '#1C7C63' }} />
                <span className="text-sm font-medium text-gray-900">Time Frame:</span>
                <span className="text-lg font-bold" style={{ color: '#1C7C63' }}>{getTimeFrameLabel()}</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses to display</p>
              )}
            </div>

            {/* Bar Chart - Monthly Trend */}
            <div 
              className="bg-white rounded-lg shadow p-6 transition-all duration-200"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0A2540', fontWeight: 600 }}>Monthly Expense Trend</h3>
              {getMonthlyExpenseData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMonthlyExpenseData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7ECEA" />
                    <XAxis dataKey="month" stroke="#667680" />
                    <YAxis stroke="#667680" />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#1C7C63" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No expenses to display</p>
              )}
            </div>
          </div>

          {/* Filter and Export Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Filter Section */}
            <div 
              className="bg-white rounded-lg shadow p-6 transition-all duration-200"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <h3 className="text-sm font-medium text-gray-900">Quick Filters</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Time', value: 'all' as const },
                  { label: 'This Month', value: 'this-month' as const },
                  { label: 'Last Month', value: 'last-month' as const },
                  { label: 'This Year', value: 'this-year' as const }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setActiveFilter(filter.value)
                      const now = new Date()
                      if (filter.value === 'all') {
                        setDateRange(null)
                      } else if (filter.value === 'this-month') {
                        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                        setDateRange({ start, end })
                      } else if (filter.value === 'last-month') {
                        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
                        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
                        setDateRange({ start, end })
                      } else if (filter.value === 'this-year') {
                        const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
                        const end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
                        setDateRange({ start, end })
                      }
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
              <div className="mt-4">
                <DateRangeFilter 
                  onDateRangeChange={(range) => {
                    setDateRange(range)
                    setActiveFilter(null)
                  }}
                  selectedRange={dateRange}
                />
              </div>
            </div>

            {/* Export Section */}
            <div 
              className="bg-white rounded-lg shadow p-6 transition-all duration-200"
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" style={{ color: '#1C7C63' }} />
                <h3 className="text-sm font-medium text-gray-900">Export</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <ExportButtons 
                  expenses={expenses}
                  properties={properties}
                  maintenanceTasks={maintenanceTasks}
                  dateRange={dateRange}
                />
              </div>
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t" style={{ borderColor: '#E5E9E7' }}>
                {getFilteredExpenses().length} Expenses · {getUniquePropertiesCount()} Properties · {maintenanceTasks.filter(t => t.status === 'pending').length} Tasks
              </div>
            </div>
          </div>

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
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-semibold" style={{ borderRadius: '12px' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>TOTAL</span>
                    <span className="text-lg font-semibold text-red-600">${getTotalExpenses().toFixed(2)}</span>
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
                    <div className="flex items-center space-x-1">
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
                    <div className="flex items-center space-x-1">
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
                    <div className="flex items-center space-x-1">
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
                    <div className="flex items-center space-x-1">
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
                      className="transition-all duration-150"
                      style={{
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FAF9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
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
                          <span className="text-gray-400 text-xs">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit expense"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {/* Totals Row */}
                {getFilteredExpenses().length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-900" style={{ fontWeight: 600 }}>
                      TOTAL
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
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
      </Layout>
    </ProtectedRoute>
  )
}
