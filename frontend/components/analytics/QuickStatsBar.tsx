// Quick stats bar component for top-level insights

'use client'

import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'

interface QuickStat {
  label: string
  value: number | string
  format?: 'currency' | 'number' | 'percentage'
  trend?: number
  icon?: string
}

interface QuickStatsBarProps {
  stats: QuickStat[]
  className?: string
}

export default function QuickStatsBar({ stats, className = '' }: QuickStatsBarProps) {
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return formatPercentage(value)
      default:
        return formatNumber(value)
    }
  }

  return (
    <div className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            {stat.icon && (
              <div className="text-2xl mb-2">{stat.icon}</div>
            )}
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatValue(stat.value, stat.format)}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
            {stat.trend !== undefined && (
              <div className={`text-xs mt-1 font-medium ${
                stat.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend >= 0 ? '↑' : '↓'} {formatPercentage(Math.abs(stat.trend))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

