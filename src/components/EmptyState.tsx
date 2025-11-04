'use client'

import { Plus, Home, Wrench, DollarSign, FileText } from 'lucide-react'

interface EmptyStateProps {
  type: 'properties' | 'expenses' | 'maintenance' | 'documents' | 'reports'
  onAction?: () => void
  actionText?: string
}

const emptyStateConfig = {
  properties: {
    icon: Home,
    title: 'No properties added yet.',
    description: 'Start by adding your first property to track rent and tenants.',
    actionText: 'Add Property',
    color: 'text-blue-600'
  },
  expenses: {
    icon: DollarSign,
    title: 'No Expenses Recorded',
    description: 'Start tracking your property expenses to monitor your investment performance.',
    actionText: 'Add Expense',
    color: 'text-green-600'
  },
  maintenance: {
    icon: Wrench,
    title: 'No Maintenance Tasks',
    description: 'Keep your properties in top condition by tracking maintenance tasks.',
    actionText: 'Add Task',
    color: 'text-orange-600'
  },
  documents: {
    icon: FileText,
    title: 'No Documents Uploaded',
    description: 'Store important property documents like leases, insurance, and receipts.',
    actionText: 'Upload Document',
    color: 'text-purple-600'
  },
  reports: {
    icon: DollarSign,
    title: 'No Data for Reports',
    description: 'Add properties and expenses to generate financial reports.',
    actionText: 'Add Property',
    color: 'text-indigo-600'
  }
}

export default function EmptyState({ type, onAction, actionText }: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center">
        <span className="text-6xl">🏡</span>
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: '#0A2540' }}>{config.title}</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{config.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200"
          style={{
            backgroundColor: '#1C7C63',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#155A47'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1C7C63'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionText || config.actionText}
        </button>
      )}
    </div>
  )
}

export const EmptyStateCard = ({ type, onAction, actionText }: EmptyStateProps) => {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-500 mb-4">{config.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionText || config.actionText}
        </button>
      )}
    </div>
  )
}
