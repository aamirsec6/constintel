'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>
  loading?: boolean
}

export default function RevenueChart({ data, loading = false }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        minHeight: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '12px',
        border: '2px solid #00ff41',
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: '#00ff41', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px #00ff41' }}>
            NO DATA
          </h3>
        </div>
      </div>
    )
  }

  // Calculate if trend is up or down
  const revenueData = data.filter(d => d.revenue > 0)
  const avgRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0) / (revenueData.length || 1)
  const recentRevenue = revenueData.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7
  const isProfit = recentRevenue >= avgRevenue

  const neonGreen = '#00ff41'
  const neonRed = '#ff0055'
  const lineColor = isProfit ? neonGreen : neonRed
  const glowColor = isProfit ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 0, 85, 0.4)'

  return (
    <div style={{ 
      width: '100%', 
      height: '450px', 
      padding: '20px',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a2e 100%)',
      borderRadius: '12px',
      border: `2px solid ${lineColor}`,
      boxShadow: `0 0 30px ${glowColor}`,
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: `2px solid ${lineColor}`,
              borderRadius: '8px',
              padding: '12px',
              boxShadow: `0 0 20px ${glowColor}`,
              color: '#fff',
            }}
            labelStyle={{ color: lineColor, fontWeight: 'bold', marginBottom: '8px' }}
            formatter={(value: any) => [
              `$${Number(value).toLocaleString()}`,
              <span style={{ color: lineColor, fontWeight: 'bold', textShadow: `0 0 5px ${lineColor}` }}>
                {isProfit ? '📈 PROFIT' : '📉 DECLINE'}
              </span>
            ]}
            labelFormatter={(label) => {
              const date = new Date(label)
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={lineColor}
            strokeWidth={3}
            fill="url(#colorRevenue)"
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: lineColor,
              stroke: '#fff',
              strokeWidth: 2,
              filter: `drop-shadow(0 0 8px ${lineColor})`
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '-10px',
        color: lineColor,
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${lineColor}`,
        letterSpacing: '2px'
      }}>
        {isProfit ? '🚀 TRENDING UP' : '⚠️ TRENDING DOWN'}
      </div>
    </div>
  )
}

