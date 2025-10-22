'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface MobileTableProps {
  data: any[]
  columns: {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
    mobileLabel?: string
  }[]
  actions?: (row: any) => React.ReactNode
  className?: string
}

export default function MobileTable({ data, columns, actions, className = '' }: MobileTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6 text-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {data.map((row, index) => (
          <div key={index} className="border-b border-gray-200 last:border-b-0">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleRow(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {row[columns[0].key]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {columns[1] && row[columns[1].key]}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </div>
                  )}
                  {expandedRows.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedRows.has(index) && (
              <div className="px-4 pb-4 bg-gray-50">
                <div className="space-y-2">
                  {columns.slice(2).map((column) => (
                    <div key={column.key} className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        {column.mobileLabel || column.label}:
                      </span>
                      <span className="text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
