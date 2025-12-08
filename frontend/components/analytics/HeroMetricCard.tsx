// Hero Metric Card - Large, prominent KPI display for retail dashboard
// Designed for top-of-page hero section

'use client'

import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface HeroMetricCardProps {
  title: string
  value: number | string
  previousValue?: number | string
  trend?: number
  subtitle?: string
  icon?: React.ReactNode
  format?: 'currency' | 'number' | 'percentage'
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'indigo'
  periodComparison?: string // e.g., "vs last month", "vs last year"
  highlight?: string // e.g., "Best day: $X,XXX"
}

export default function HeroMetricCard({
  title,
  value,
  previousValue,
  trend,
  subtitle,
  icon,
  format = 'number',
  color = 'blue',
  periodComparison,
  highlight,
}: HeroMetricCardProps) {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
  const numericPrevious = previousValue !== undefined 
    ? (typeof previousValue === 'string' ? parseFloat(previousValue) || 0 : previousValue || 0)
    : null
  
  const hasData = numericValue > 0
  const hasComparison = numericPrevious !== null && numericPrevious > 0
  
  // Calculate change if we have previous value
  const change = hasComparison && numericPrevious > 0
    ? ((numericValue - numericPrevious) / numericPrevious) * 100
    : trend !== undefined ? trend : null

  const formattedValue =
    format === 'currency' ? formatCurrency(numericValue) :
    format === 'percentage' ? formatPercentage(numericValue) :
    formatNumber(numericValue)

  const formattedPrevious = hasComparison && numericPrevious !== null
    ? (format === 'currency' ? formatCurrency(numericPrevious) :
       format === 'percentage' ? formatPercentage(numericPrevious) :
       formatNumber(numericPrevious))
    : null

  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bg: 'bg-gradient-to-br from-blue-50 via-indigo-50/30 to-blue-50/50',
      border: 'border-blue-200/80',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      text: 'text-blue-700',
      accent: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    green: {
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      bg: 'bg-gradient-to-br from-green-50 via-emerald-50/30 to-green-50/50',
      border: 'border-green-200/80',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      text: 'text-green-700',
      accent: 'text-green-600',
      valueColor: 'text-green-700',
    },
    purple: {
      gradient: 'from-purple-500 via-violet-600 to-fuchsia-600',
      bg: 'bg-gradient-to-br from-purple-50 via-violet-50/30 to-purple-50/50',
      border: 'border-purple-200/80',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      text: 'text-purple-700',
      accent: 'text-purple-600',
      valueColor: 'text-purple-700',
    },
    orange: {
      gradient: 'from-orange-500 via-amber-600 to-yellow-600',
      bg: 'bg-gradient-to-br from-orange-50 via-amber-50/30 to-orange-50/50',
      border: 'border-orange-200/80',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      text: 'text-orange-700',
      accent: 'text-orange-600',
      valueColor: 'text-orange-700',
    },
    indigo: {
      gradient: 'from-indigo-500 via-indigo-600 to-blue-600',
      bg: 'bg-gradient-to-br from-indigo-50 via-indigo-50/30 to-blue-50/50',
      border: 'border-indigo-200/80',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      text: 'text-indigo-700',
      accent: 'text-indigo-600',
      valueColor: 'text-indigo-700',
    },
  }

  const config = colorConfig[color]
  const isPositive = change !== null ? change >= 0 : (trend !== undefined ? trend >= 0 : true)

  return (
    <div className={cn(
      'relative rounded-2xl border-2 p-8 transition-all duration-300',
      'hover:shadow-2xl hover:scale-[1.01]',
      'backdrop-blur-sm',
      config.bg,
      config.border,
      !hasData && 'opacity-75'
    )}>
      {/* Decorative gradient overlay */}
      <div className={cn(
        'absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-15',
        `bg-gradient-to-br ${config.gradient}`
      )}></div>
      
      <div className="relative z-10">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {icon && (
              <div className={cn(
                'p-3 rounded-xl shadow-lg',
                config.iconBg,
                'flex items-center justify-center'
              )}>
                <span className="text-2xl">{icon}</span>
              </div>
            )}
            <div>
              <h3 className={cn('text-sm font-bold uppercase tracking-wider mb-1', config.text)}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Trend indicator */}
          {change !== null && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'shadow-sm backdrop-blur-sm',
              isPositive 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/50'
            )}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-bold">
                {formatPercentage(Math.abs(change), 1, isPositive)}
              </span>
            </div>
          )}
        </div>
        
        {/* Main value */}
        <div className="mb-4">
          <p className={cn(
            'text-6xl font-extrabold mb-2 leading-none',
            hasData ? config.valueColor : 'text-gray-400',
            'transition-colors duration-300'
          )}>
            {formattedValue}
          </p>
          
          {/* Previous period comparison */}
          {hasComparison && formattedPrevious && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-gray-500">
                {periodComparison || 'vs previous period'}: 
              </p>
              <p className={cn(
                'text-sm font-semibold',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {formattedPrevious}
              </p>
            </div>
          )}
          
          {/* Highlight */}
          {highlight && (
            <p className="text-xs text-gray-600 mt-2 font-medium">
              {highlight}
            </p>
          )}
        </div>
        
        {!hasData && (
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 italic">
              No data available for this period
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

