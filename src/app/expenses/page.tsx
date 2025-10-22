'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getExpenses, deleteExpense, getProperties, getMaintenanceTasks } from '@/lib/database'
import { Expense, Property, MaintenanceTask } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import FileUpload from '@/components/FileUpload'
import DateRangeFilter from '@/components/DateRangeFilter'
import ExportButtons from '@/components/ExportButtons'
import { uploadFile } from '@/lib/storage'
import { Plus, Trash2, Download, Eye } from 'lucide-react'

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
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [newExpense, setNewExpense] = useState({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Repairs',
    description: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

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
        description: newExpense.description || null,
        receipt_url: receiptUrl,
      })
      
      setExpenses([...expenses, expense])
      setNewExpense({ property_id: '', date: new Date().toISOString().split('T')[0], amount: '', category: 'Repairs', description: '' })
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

  const getFilteredExpenses = () => {
    if (!dateRange) return expenses
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      return expenseDate >= startDate && expenseDate <= endDate
    })
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

          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            selectedRange={dateRange}
          />

          <ExportButtons 
            expenses={expenses}
            properties={properties}
            maintenanceTasks={maintenanceTasks}
            dateRange={dateRange}
          />

          {showAddExpense && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Add Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={newExpense.property_id}
                    onChange={(e) => setNewExpense({ ...newExpense, property_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
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
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
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
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Plumbing repair - kitchen sink"
                  />
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
                  onClick={addExpense}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : 'Save Expense'}
                </button>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Expenses {dateRange ? `(${dateRange.start} to ${dateRange.end})` : '(All Time)'}
                </h3>
                <div className="text-sm text-gray-500">
                  {getFilteredExpenses().length} of {expenses.length} expenses
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredExpenses().map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getPropertyAddress(expense.property_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">${expense.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.receipt_url ? (
                        <div className="flex space-x-2">
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={expense.receipt_url}
                            download
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400">No receipt</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
