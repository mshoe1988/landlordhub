'use client'

import { useState } from 'react'
import { Calendar, Filter } from 'lucide-react'

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: { start: string; end: string } | null) => void
  selectedRange: { start: string; end: string } | null
}

export default function DateRangeFilter({ onDateRangeChange, selectedRange }: DateRangeFilterProps) {
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const predefinedRanges = [
    'This Month',
    'Last Month', 
    'This Quarter',
    'This Year'
  ]

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

  const handlePredefinedRange = (rangeName: string) => {
    const options = getDateRangeOptions()
    const range = options[rangeName as keyof typeof options]
    if (range) {
      onDateRangeChange(range)
      setShowCustomRange(false)
    }
  }

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onDateRangeChange({ start: customStart, end: customEnd })
    }
  }

  const clearFilter = () => {
    onDateRangeChange(null)
    setShowCustomRange(false)
    setCustomStart('')
    setCustomEnd('')
  }

  const getCurrentRangeLabel = () => {
    if (!selectedRange) return 'All Time'
    
    const options = getDateRangeOptions()
    for (const [name, range] of Object.entries(options)) {
      if (range.start === selectedRange.start && range.end === selectedRange.end) {
        return name
      }
    }
    
    return `Custom: ${selectedRange.start} to ${selectedRange.end}`
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter Expenses
        </h3>
        <div className="text-sm text-gray-600">
          Current: {getCurrentRangeLabel()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {predefinedRanges.map((range) => (
          <button
            key={range}
            onClick={() => handlePredefinedRange(range)}
            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
              selectedRange && 
              getDateRangeOptions()[range as keyof ReturnType<typeof getDateRangeOptions>]?.start === selectedRange.start
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowCustomRange(!showCustomRange)}
          className={`px-4 py-2 text-sm rounded-md border transition-colors flex items-center gap-2 ${
            showCustomRange
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Custom Range
        </button>

        {selectedRange && (
          <button
            onClick={clearFilter}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Clear Filter
          </button>
        )}
      </div>

      {showCustomRange && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleCustomRange}
              disabled={!customStart || !customEnd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Custom Range
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
