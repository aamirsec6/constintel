// GENERATOR: ANALYTICS_DASHBOARD
// Segment performance comparison charts
// HOW TO USE: <SegmentComparison segments={segmentData} />

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface SegmentMetrics {
  segment: string
  size: number
  revenue: {
    total: number
    percentage: number
  }
  ltv: {
    average: number
  }
  churnRate: number
}

interface SegmentComparisonProps {
  segments: SegmentMetrics[]
  chartType?: 'bar' | 'pie'
  metric?: 'revenue' | 'size' | 'ltv'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function SegmentComparison({
  segments,
  chartType = 'bar',
  metric = 'revenue',
}: SegmentComparisonProps) {
  const formatValue = (value: number) => {
    if (metric === 'revenue' || metric === 'ltv') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    return value.toLocaleString('en-US')
  }

  const chartData = segments.map(s => ({
    name: s.segment,
    revenue: s.revenue.total,
    size: s.size,
    ltv: s.ltv.average,
    churnRate: s.churnRate,
  }))

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey={metric}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatValue} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          tickFormatter={formatValue}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip formatter={formatValue} />
        <Legend />
        <Bar 
          dataKey={metric} 
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

