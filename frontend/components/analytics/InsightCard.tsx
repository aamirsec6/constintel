// Individual insight card component

'use client'

import { AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils/cn'

interface InsightCardProps {
  title: string
  description: string
  type: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
  metric: string
}

export default function InsightCard({
  title,
  description,
  type,
  impact,
  metric,
}: InsightCardProps) {
  const icons = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Info,
  }

  const colors = {
    positive: 'border-green-200 bg-green-50',
    negative: 'border-red-200 bg-red-50',
    neutral: 'border-blue-200 bg-blue-50',
  }

  const iconColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-blue-600',
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-all hover:shadow-md',
        colors[type]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-white', iconColors[type])}>
            <Icon className="w-5 h-5" />
          </div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <Badge variant={impact === 'high' ? 'destructive' : impact === 'medium' ? 'warning' : 'secondary'}>
          {impact.toUpperCase()}
        </Badge>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{description}</p>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-xs font-medium text-gray-600">📊 {metric}</span>
      </div>
    </div>
  )
}

