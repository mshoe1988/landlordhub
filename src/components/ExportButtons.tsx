'use client'

import { useState } from 'react'
import { Download, FileText, Database } from 'lucide-react'
import { exportExpensesToCSV, exportAllDataToCSV } from '@/lib/csvExport'
import { Expense, Property, MaintenanceTask } from '@/lib/types'

interface ExportButtonsProps {
  expenses: Expense[]
  properties: Property[]
  maintenanceTasks?: MaintenanceTask[]
  dateRange?: { start: string; end: string } | null
}

export default function ExportButtons({ 
  expenses, 
  properties, 
  maintenanceTasks = [], 
  dateRange 
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingAll, setIsExportingAll] = useState(false)

  const handleExportExpenses = async () => {
    setIsExporting(true)
    try {
      exportExpensesToCSV(expenses, properties, dateRange || undefined)
    } catch (error) {
      console.error('Error exporting expenses:', error)
      alert('Failed to export expenses')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAllData = async () => {
    setIsExportingAll(true)
    try {
      exportAllDataToCSV(properties, expenses, maintenanceTasks)
    } catch (error) {
      console.error('Error exporting all data:', error)
      alert('Failed to export all data')
    } finally {
      setIsExportingAll(false)
    }
  }

  const getExportLabel = () => {
    if (dateRange) {
      return `Export Filtered (${dateRange.start} to ${dateRange.end})`
    }
    return 'Export All Expenses'
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Data</h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportExpenses}
          disabled={isExporting || expenses.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
          style={{
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {getExportLabel()}
            </>
          )}
        </button>

        <button
          onClick={handleExportAllData}
          disabled={isExportingAll}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
          style={{
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {isExportingAll ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Export All Data
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>Expenses: {expenses.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-4 h-4" />
            <span>Properties: {properties.length}</span>
          </div>
          {maintenanceTasks.length > 0 && (
            <div className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              <span>Tasks: {maintenanceTasks.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p><strong>Expenses Export:</strong> Date, Property, Category, Description, Amount</p>
        <p><strong>All Data Export:</strong> Complete backup with properties, expenses, and maintenance tasks</p>
      </div>
    </div>
  )
}
