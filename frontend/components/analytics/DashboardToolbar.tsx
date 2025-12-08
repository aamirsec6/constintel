// Professional toolbar for date range and metric selection with quick presets

'use client'

import { Calendar, TrendingUp, Clock } from 'lucide-react'
import DateRangePicker, { DateRange } from './DateRangePicker'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface DashboardToolbarProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  selectedMetric: string
  onMetricChange: (metric: string) => void
}

const QUICK_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'This Month', days: -1 }, // Special case
  { label: 'Last Month', days: -2 }, // Special case
]

export default function DashboardToolbar({
  dateRange,
  onDateRangeChange,
  selectedMetric,
  onMetricChange,
}: DashboardToolbarProps) {
  const applyPreset = (days: number) => {
    const endDate = new Date()
    let startDate = new Date()
    
    if (days === -1) {
      // This month
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    } else if (days === -2) {
      // Last month
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
      endDate.setDate(0) // Last day of previous month
    } else {
      startDate.setDate(startDate.getDate() - days)
    }
    
    onDateRangeChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
  }

  const isPresetActive = (days: number) => {
    const endDate = new Date()
    let startDate = new Date()
    
    if (days === -1) {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    } else if (days === -2) {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
      endDate.setDate(0)
    } else {
      startDate.setDate(startDate.getDate() - days)
    }
    
    const presetStart = startDate.toISOString().split('T')[0]
    const presetEnd = endDate.toISOString().split('T')[0]
    
    return dateRange.startDate === presetStart && dateRange.endDate === presetEnd
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200/60 shadow-lg p-6">
      <div className="flex flex-col gap-6">
        {/* Quick Presets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Quick Select</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                size="sm"
                variant={isPresetActive(preset.days) ? 'secondary' : 'outline'}
                className={cn(
                  'text-xs font-semibold',
                  isPresetActive(preset.days) && 'shadow-md'
                )}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Date Range */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Custom Date Range</label>
            </div>
            <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
          </div>

          {/* Metric Selector */}
          <div className="lg:w-64">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Primary Metric</label>
            </div>
            <Select
              value={selectedMetric}
              onChange={(e) => onMetricChange(e.target.value)}
              className="w-full"
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="customers">Customers</option>
              <option value="avgOrderValue">Avg Order Value</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

