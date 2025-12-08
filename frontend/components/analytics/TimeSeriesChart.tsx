// GENERATOR: ANALYTICS_DASHBOARD
// Time series line/area chart component using Recharts
// HOW TO USE: <TimeSeriesChart data={timeSeriesData} metric="revenue" />

'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
}

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[]
  metric: string
  type?: 'line' | 'area'
  showGrid?: boolean
  height?: number
}

export default function TimeSeriesChart({
  data,
  metric,
  type = 'line',
  showGrid = true,
  height = 300,
}: TimeSeriesChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatValue = (value: number) => {
    if (metric.includes('revenue') || metric.includes('ltv')) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    return value.toLocaleString('en-US')
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart
  // @ts-ignore - Recharts component types have compatibility issues
  const DataComponent: any = type === 'area' ? Area : Line

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
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
        <DataComponent
          type="monotone"
          dataKey="value"
          stroke={type === 'area' ? '#6366f1' : '#3b82f6'}
          fill={type === 'area' ? 'url(#colorGradient)' : undefined}
          fillOpacity={type === 'area' ? 0.4 : undefined}
          strokeWidth={3}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          name={metric.charAt(0).toUpperCase() + metric.slice(1)}
        />
        {type === 'area' && (
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        )}
      </ChartComponent>
    </ResponsiveContainer>
  )
}

