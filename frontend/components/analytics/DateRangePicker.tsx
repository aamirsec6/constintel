// GENERATOR: ANALYTICS_DASHBOARD
// Date range picker component for analytics filters
// HOW TO USE: <DateRangePicker value={range} onChange={setRange} />

'use client'

import { useState } from 'react'

export interface DateRange {
  startDate: string
  endDate: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last Year', days: 365 },
]

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false)

  const applyPreset = (days: number) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    onChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
    setShowPresets(false)
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input
          type="date"
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Quick Select ↓
        </button>
        
        {showPresets && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPresets(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.days)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

