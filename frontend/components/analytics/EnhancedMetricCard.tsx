// Enhanced metric card with icons, sparklines, and better visuals

'use client'

import { formatCurrency, formatNumber, formatPercentage, getTrendColor, getTrendIcon } from '@/lib/utils/format'

interface EnhancedMetricCardProps {
  title: string
  value: string | number
  trend?: number
  subtitle?: string
  icon?: string // Emoji or icon name
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
  sparkline?: number[] // Mini chart data
  className?: string
  format?: 'currency' | 'number' | 'percentage'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    trend: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    trend: 'text-red-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    trend: 'text-indigo-600',
  },
}

export default function EnhancedMetricCard({
  title,
  value,
  trend,
  subtitle,
  icon = '📊',
  color = 'blue',
  sparkline,
  className = '',
  format = 'number',
}: EnhancedMetricCardProps) {
  const colors = colorClasses[color]
  
  const formattedValue = 
    format === 'currency' ? formatCurrency(value as number) :
    format === 'percentage' ? formatPercentage(value as number) :
    formatNumber(value as number)

  const trendColor = trend !== undefined ? getTrendColor(trend) : 'text-gray-500'
  const trendIcon = trend !== undefined ? getTrendIcon(trend) : null

  // Simple sparkline rendering
  const renderSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null
    
    const max = Math.max(...sparkline)
    const min = Math.min(...sparkline)
    const range = max - min || 1
    const width = 60
    const height = 20
    const padding = 2

    const points = sparkline.map((val, i) => {
      const x = (i / (sparkline.length - 1 || 1)) * (width - padding * 2) + padding
      const y = height - ((val - min) / range) * (height - padding * 2) - padding
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="absolute bottom-2 right-4 opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={colors.trend}
        />
      </svg>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-lg hover:scale-[1.02] ${className}`}>
      {/* Background gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.iconBg} rounded-full -mr-16 -mt-16 opacity-20`}></div>
      
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-12 h-12 ${colors.iconBg} rounded-lg ${colors.iconColor} text-xl`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-white/80 ${trendColor} text-sm font-semibold`}>
            <span className="text-xs">{trendIcon}</span>
            <span>{formatPercentage(Math.abs(trend), 1, false)}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10">
        <p className="text-3xl font-bold text-gray-900 mb-1">{formattedValue}</p>
        <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Sparkline */}
      {renderSparkline()}
    </div>
  )
}

