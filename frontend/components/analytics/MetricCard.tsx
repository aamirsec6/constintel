// GENERATOR: ANALYTICS_DASHBOARD
// Enhanced metric card component with trend indicators
// HOW TO USE: <MetricCard title="Revenue" value={1000} trend={5.2} />

'use client'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number // Percentage change
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export default function MetricCard({ 
  title, 
  value, 
  trend, 
  subtitle, 
  icon,
  className = '' 
}: MetricCardProps) {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : value

  const trendColor = trend !== undefined
    ? trend >= 0 ? 'text-green-600' : 'text-red-600'
    : 'text-gray-500'

  const trendIcon = trend !== undefined
    ? trend >= 0 ? '↑' : '↓'
    : null

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {subtitle && (
        <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  )
}

