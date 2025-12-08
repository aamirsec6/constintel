// GENERATOR: ANALYTICS_DASHBOARD
// ML prediction trends visualization
// HOW TO USE: <PredictionTrends trends={predictionTrendsData} />

'use client'

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PredictionTrend {
  date: string
  atRiskCount: number
  avgChurnScore: number
  avgPredictedLTV: number
  segmentDistribution: {
    [segment: string]: number
  }
}

interface PredictionTrendsProps {
  trends: PredictionTrend[]
  metric?: 'atRiskCount' | 'avgChurnScore' | 'avgPredictedLTV'
}

export default function PredictionTrends({
  trends,
  metric = 'atRiskCount',
}: PredictionTrendsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatValue = (value: number) => {
    if (metric === 'avgPredictedLTV') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    if (metric === 'avgChurnScore') {
      return `${(value * 100).toFixed(1)}%`
    }
    return value.toLocaleString('en-US')
  }

  const chartData = trends.map(t => ({
    date: t.date,
    atRiskCount: t.atRiskCount,
    avgChurnScore: t.avgChurnScore * 100, // Convert to percentage
    avgPredictedLTV: t.avgPredictedLTV,
  }))

  const metricLabels = {
    atRiskCount: 'At-Risk Customers',
    avgChurnScore: 'Average Churn Score',
    avgPredictedLTV: 'Average Predicted LTV',
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          tickFormatter={formatValue}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          formatter={(value: number) => formatValue(value)}
          labelFormatter={(label) => formatDate(label)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
          name={metricLabels[metric]}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

