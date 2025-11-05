'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'

interface CostInputModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (cost: number) => void
  taskName: string
  propertyAddress: string
}

export default function CostInputModal({ isOpen, onClose, onConfirm, taskName, propertyAddress }: CostInputModalProps) {
  const [cost, setCost] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const costValue = parseFloat(cost)
    
    if (isNaN(costValue) || costValue < 0) {
      alert('Please enter a valid cost amount')
      return
    }

    setLoading(true)
    try {
      await onConfirm(costValue)
      setCost('')
      onClose()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Failed to add expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCost('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add Cost</h3>
              <p className="text-sm text-gray-500">Maintenance completed</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Task:</span> {taskName}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Property:</span> {propertyAddress}
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              What was the total cost?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="cost"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be added to your expenses as "Maintenance"
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading || !cost}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}









