// Alert-style anomaly card component

'use client'

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface AnomalyAlertCardProps {
  date: string
  metric: string
  value: number
  expected: number
  deviation: number
  explanation?: string
  type: 'spike' | 'drop' | 'unusual'
}

export default function AnomalyAlertCard({
  date,
  metric,
  value,
  expected,
  deviation,
  explanation,
  type,
}: AnomalyAlertCardProps) {
  const isPositive = deviation > 0
  const colors = {
    spike: 'border-green-500 bg-green-50',
    drop: 'border-red-500 bg-red-50',
    unusual: 'border-yellow-500 bg-yellow-50',
  }

  const icons = {
    spike: TrendingUp,
    drop: TrendingDown,
    unusual: AlertTriangle,
  }

  const iconColors = {
    spike: 'text-green-600',
    drop: 'text-red-600',
    unusual: 'text-yellow-600',
  }

  const Icon = icons[type]

  const formatValue = (val: number) => {
    if (metric.toLowerCase().includes('revenue') || metric.toLowerCase().includes('ltv')) {
      return formatCurrency(val)
    }
    if (metric.toLowerCase().includes('growth') || metric.toLowerCase().includes('change')) {
      return formatPercentage(val)
    }
    return formatNumber(val)
  }

  return (
    <div className={cn('rounded-xl border-2 p-5 transition-all hover:shadow-lg', colors[type])}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-white', iconColors[type])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {metric.charAt(0).toUpperCase() + metric.slice(1)} {type}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {formatDate(date, 'medium')}
            </p>
          </div>
        </div>
        <Badge variant={type === 'drop' ? 'destructive' : type === 'spike' ? 'success' : 'warning'}>
          {isPositive ? '+' : ''}{formatPercentage(Math.abs(deviation), 1, false)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Actual Value</p>
          <p className="text-lg font-bold text-gray-900">{formatValue(value)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Expected Value</p>
          <p className="text-lg font-semibold text-gray-700">{formatValue(expected)}</p>
        </div>
      </div>

      {explanation && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-1">AI Explanation:</p>
          <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  )
}

