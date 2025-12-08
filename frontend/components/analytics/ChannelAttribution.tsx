// GENERATOR: ANALYTICS_DASHBOARD
// Channel performance and attribution charts
// HOW TO USE: <ChannelAttribution channels={channelData} />

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ChannelMetrics {
  channel: string
  revenue: {
    total: number
    percentage: number
  }
  customers: {
    acquired: number
    percentage: number
  }
  roi: number
  avgOrderValue: number
  conversionRate: number
}

interface ChannelAttributionProps {
  channels: ChannelMetrics[]
  chartType?: 'bar' | 'pie'
  metric?: 'revenue' | 'customers' | 'conversionRate'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function ChannelAttribution({
  channels,
  chartType = 'bar',
  metric = 'revenue',
}: ChannelAttributionProps) {
  const formatValue = (value: number) => {
    if (metric === 'revenue') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    if (metric === 'conversionRate') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString('en-US')
  }

  const chartData = channels.map(c => ({
    name: c.channel,
    revenue: c.revenue.total,
    customers: c.customers.acquired,
    conversionRate: c.conversionRate,
    roi: c.roi,
    avgOrderValue: c.avgOrderValue,
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

