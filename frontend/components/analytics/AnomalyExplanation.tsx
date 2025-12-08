// GENERATOR: OLLAMA_INTEGRATION
// Anomaly explanation component
// HOW TO USE: <AnomalyExplanation brandId={brandId} dateRange={dateRange} />

'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import axios from 'axios'

interface Anomaly {
  date: string
  metric: string
  value: number
  expected: number
  deviation: number
  explanation?: string
  type: 'spike' | 'drop' | 'unusual'
}

interface DateRange {
  startDate: string
  endDate: string
}

interface AnomalyExplanationProps {
  brandId: string
  dateRange: DateRange
  metric?: 'revenue' | 'orders' | 'customers'
  className?: string
}

export default function AnomalyExplanation({
  brandId,
  dateRange,
  metric,
  className = '',
}: AnomalyExplanationProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const fetchAnomalies = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('brand_token')

      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }

      if (metric) {
        params.metric = metric
      }

      const response = await axios.get(`${apiUrl}/api/analytics/anomalies`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'x-brand-id': brandId,
        },
      })

      if (response.data.success && response.data.data?.anomalies) {
        setAnomalies(response.data.data.anomalies)
      } else {
        setError('Failed to load anomalies')
      }
    } catch (err: any) {
      console.error('Error fetching anomalies:', err)
      setError(err.response?.data?.error || 'Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (brandId && dateRange.startDate && dateRange.endDate) {
      fetchAnomalies()
    }
  }, [brandId, dateRange.startDate, dateRange.endDate, metric])

  const getAnomalyColor = (type: string) => {
    switch (type) {
      case 'spike':
        return 'border-green-500 bg-green-50'
      case 'drop':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-yellow-500 bg-yellow-50'
    }
  }

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return '📈'
      case 'drop':
        return '📉'
      default:
        return '⚠️'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Anomalies</h2>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
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
          <h2 className="text-xl font-semibold mb-4">Data Anomalies</h2>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <Button onClick={fetchAnomalies} size="sm">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Data Anomalies</h2>
          <Button onClick={fetchAnomalies} size="sm" variant="outline">
            Refresh
          </Button>
        </div>

        {anomalies.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            No anomalies detected for this period.
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly, index) => {
              const isExpanded = expandedAnomaly === `${anomaly.date}-${anomaly.metric}`
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getAnomalyColor(anomaly.type)} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => setExpandedAnomaly(isExpanded ? null : `${anomaly.date}-${anomaly.metric}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getAnomalyIcon(anomaly.type)}</span>
                        <h3 className="font-semibold text-gray-900">
                          {anomaly.metric.charAt(0).toUpperCase() + anomaly.metric.slice(1)} {anomaly.type}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(anomaly.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        Value: {anomaly.value.toLocaleString()} (Expected: {anomaly.expected.toLocaleString()})
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        Deviation: {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {isExpanded && anomaly.explanation && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-sm font-semibold text-gray-900 mb-1">AI Explanation:</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{anomaly.explanation}</p>
                    </div>
                  )}

                  {!anomaly.explanation && (
                    <p className="text-xs text-gray-500 mt-2">Click to load explanation...</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {anomalies.length > 5 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing 5 of {anomalies.length} anomalies
          </div>
        )}
      </div>
    </Card>
  )
}

