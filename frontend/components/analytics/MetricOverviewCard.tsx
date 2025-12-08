// Enhanced metric overview card with sparkline - Professional Design

'use client'

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface MetricOverviewCardProps {
  title: string
  value: number | string
  trend?: number
  subtitle?: string
  icon?: React.ReactNode
  format?: 'currency' | 'number' | 'percentage'
  sparkline?: number[]
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export default function MetricOverviewCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  format = 'number',
  sparkline,
  color = 'blue',
}: MetricOverviewCardProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
  const hasData = numericValue > 0 || (sparkline && sparkline.length > 0 && sparkline.some(v => v > 0))
  
  const formattedValue =
    format === 'currency' ? formatCurrency(numericValue) :
    format === 'percentage' ? formatPercentage(numericValue) :
    formatNumber(numericValue)

  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bg: 'bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/30',
      border: 'border-blue-200/60',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      text: 'text-blue-700',
      accent: 'text-blue-600',
    },
    green: {
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      bg: 'bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30',
      border: 'border-green-200/60',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      text: 'text-green-700',
      accent: 'text-green-600',
    },
    purple: {
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
      bg: 'bg-gradient-to-br from-purple-50 via-violet-50/50 to-fuchsia-50/30',
      border: 'border-purple-200/60',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      text: 'text-purple-700',
      accent: 'text-purple-600',
    },
    orange: {
      gradient: 'from-orange-500 via-amber-600 to-yellow-600',
      bg: 'bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50/30',
      border: 'border-orange-200/60',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      text: 'text-orange-700',
      accent: 'text-orange-600',
    },
  }

  const config = colorConfig[color]

  const renderSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null

    const max = Math.max(...sparkline, 1)
    const min = Math.min(...sparkline, 0)
    const range = max - min || 1
    const width = 100
    const height = 40

    const points = sparkline.map((val, i) => {
      const x = (i / (sparkline.length - 1 || 1)) * (width - 8) + 4
      const y = height - ((val - min) / range) * (height - 8) - 4
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="absolute bottom-4 right-4 opacity-70">
        <svg width={width} height={height} className={config.accent}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Fill area */}
          <polygon
            points={`${points.split(' ')[0].split(',')[0]},${height} ${points} ${points.split(' ')[points.split(' ').length - 1].split(',')[0]},${height}`}
            fill={`url(#gradient-${color})`}
            opacity="0.15"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative rounded-2xl border-2 p-6 transition-all duration-300',
      'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1',
      'backdrop-blur-sm',
      config.bg,
      config.border,
      !hasData && 'opacity-75'
    )}>
      {/* Decorative gradient overlay */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20',
        `bg-gradient-to-br ${config.gradient}`
      )}></div>
      
      {renderSparkline()}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {icon && (
                <div className={cn(
                  'p-2.5 rounded-xl shadow-lg',
                  config.iconBg,
                  'flex items-center justify-center'
                )}>
                  <span className="text-lg">{icon}</span>
                </div>
              )}
              <h3 className={cn('text-sm font-bold uppercase tracking-wide', config.text)}>
                {title}
              </h3>
            </div>
            
            <div className="mb-2">
              <p className={cn(
                'text-4xl font-extrabold mb-1',
                hasData ? 'text-gray-900' : 'text-gray-400',
                'transition-colors duration-300'
              )}>
                {formattedValue}
              </p>
              {subtitle && (
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {trend !== undefined && trend !== null && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
              'shadow-sm backdrop-blur-sm',
              trend >= 0 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/50'
            )}>
              {trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-bold">
                {formatPercentage(Math.abs(trend), 1, trend >= 0)}
              </span>
            </div>
          )}
        </div>
        
        {!hasData && (
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 italic">
              💡 No data available for this period
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

