// GENERATOR: OLLAMA_INTEGRATION
// Auto-generated insights panel component
// HOW TO USE: <InsightsPanel brandId={brandId} dateRange={dateRange} />

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import axios from 'axios'
import { formatDate } from '@/lib/utils/format'

interface Insight {
  title: string
  description: string
  type: 'positive' | 'negative' | 'neutral'
  metric: 'revenue' | 'orders' | 'customers' | 'segments'
  impact: 'high' | 'medium' | 'low'
}

interface DateRange {
  startDate: string
  endDate: string
}

interface InsightsPanelProps {
  brandId: string
  dateRange: DateRange
  className?: string
}

export default function InsightsPanel({ brandId, dateRange, className = '' }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('brand_token')
      
      const response = await axios.post(
        `${apiUrl}/api/analytics/insights`,
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'x-brand-id': brandId,
          },
        }
      )

      if (response.data.success && response.data.data?.insights) {
        setInsights(response.data.data.insights)
      } else {
        setError('Failed to load insights')
      }
    } catch (err: any) {
      console.error('Error fetching insights:', err)
      setError(err.response?.data?.error || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (brandId && dateRange.startDate && dateRange.endDate) {
      fetchInsights()
    }
  }, [brandId, dateRange.startDate, dateRange.endDate])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-500 bg-green-50'
      case 'negative':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return '✅'
      case 'negative':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    }
    return colors[impact as keyof typeof colors] || colors.low
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">AI-Generated Insights</h2>
            <p className="text-sm text-gray-500">Loading insights...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-5 h-32">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <Button onClick={fetchInsights} size="sm">Retry</Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">AI-Generated Insights</h2>
            <p className="text-sm text-gray-500">Automated analysis of your analytics data</p>
          </div>
          <Button onClick={fetchInsights} size="sm" variant="outline" className="shadow-sm">
            Refresh
          </Button>
        </div>

        {insights.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="text-5xl">💡</div>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No insights available yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              AI-powered insights will appear here once you have sufficient data. Upload your data to get started!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Waiting for data...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`relative overflow-hidden p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${getTypeColor(insight.type)}`}
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 ${
                  insight.type === 'positive' ? 'bg-green-500' : 
                  insight.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'
                } rounded-full -mr-12 -mt-12`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                      <h3 className="font-semibold text-gray-900 text-base">{insight.title}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getImpactBadge(
                        insight.impact
                      )}`}
                    >
                      {insight.impact.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs font-medium text-gray-600">
                      📊 {insight.metric.charAt(0).toUpperCase() + insight.metric.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            💡 Insights are automatically generated using AI. Last updated:{' '}
            {formatDate(new Date(), 'medium')}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>LLM Active</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

