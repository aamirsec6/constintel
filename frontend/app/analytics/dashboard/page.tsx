// GENERATOR: ANALYTICS_DASHBOARD
// Analytics Dashboard - Clean, Enterprise-Grade UI
// HOW TO RUN: npm run dev, visit http://localhost:3001/analytics/dashboard

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AskAI from '@/components/analytics/AskAI'

// Dynamically import Recharts to avoid SSR issues
// @ts-ignore - Recharts types have compatibility issues with Next.js dynamic imports
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
// @ts-ignore
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
// @ts-ignore
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
// @ts-ignore
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
// @ts-ignore
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
// @ts-ignore
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
// @ts-ignore
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })

interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  totalCustomers: number
  avgLTV: number
  growthRate: number
  revenueChart: Array<{ date: string; revenue: number }>
  previousPeriodRevenue: number
  previousPeriodOrders: number
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [brandId, setBrandId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    avgLTV: 0,
    growthRate: 0,
    revenueChart: [],
    previousPeriodRevenue: 0,
    previousPeriodOrders: 0,
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!storedUser || !accessToken) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      // Get brandId from user object, localStorage, or fetch test brand UUID
      const brandIdFromStorage = user.brandId || localStorage.getItem('brandId')
      
      if (brandIdFromStorage) {
        setBrandId(brandIdFromStorage)
        setLoading(false)
      } else {
        // If no brandId found, try to get test brand UUID
        fetchTestBrandId()
      }
    } catch (e) {
      const brandIdFromStorage = localStorage.getItem('brandId')
      if (brandIdFromStorage) {
        setBrandId(brandIdFromStorage)
        setLoading(false)
      } else {
        fetchTestBrandId()
      }
    }
  }, [router])

  const fetchTestBrandId = async () => {
    // Use the actual test brand UUID (from createTestBrand script)
    const testBrandId = '19354902-58de-47ad-bdde-0fcf17b68a56'
    setBrandId(testBrandId)
    localStorage.setItem('brandId', testBrandId)
    setLoading(false)
  }

  useEffect(() => {
    if (brandId && !loading) {
      fetchMetrics()
    }
  }, [brandId, dateRange, loading])

  const fetchMetrics = async () => {
    if (!brandId) return

    try {
      setLoading(true)
      setError(null)

      const accessToken = localStorage.getItem('accessToken')
      const response = await fetch(
        `${apiUrl}/api/analytics/dashboard?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'x-brand-id': brandId,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      if (data.success && data.data) {
        // Ensure chart data is properly formatted with numeric values
        const chartData = (data.data.revenueChart || []).map((point: any) => ({
          date: point.date,
          revenue: typeof point.revenue === 'number' ? point.revenue : parseFloat(point.revenue || '0')
        }))
        setMetrics({
          ...data.data,
          revenueChart: chartData
        })
      }
    } catch (err: any) {
      console.error('Error fetching metrics:', err)
      setError(err.message || 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        return
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading && !brandId) {
    return (
      <div className="container">
        <div className="loading">Loading Analytics Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div className="header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Key metrics and insights for your retail business</p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Date Range Selector */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Date Range</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'last_30_days', label: 'Last 30 Days' },
            { id: 'last_90_days', label: 'Last 90 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => handlePeriodChange(period.id)}
              className={selectedPeriod === period.id ? 'btn' : 'btn btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
              From:
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
              To:
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="customers">Customers</option>
              <option value="avgOrderValue">Average Order Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>TOTAL REVENUE</span>
            <span style={{ 
              fontSize: '12px', 
              color: metrics.growthRate >= 0 ? '#10b981' : '#ef4444', 
              fontWeight: '600' 
            }}>
              {formatPercentage(metrics.growthRate)}
            </span>
          </div>
          <div className="stat-value">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="stat-label">Current period</div>
          {metrics.totalRevenue === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>TOTAL ORDERS</span>
            <span style={{ 
              fontSize: '12px', 
              color: calculateDelta(metrics.totalOrders, metrics.previousPeriodOrders) >= 0 ? '#10b981' : '#ef4444', 
              fontWeight: '600' 
            }}>
              {formatPercentage(calculateDelta(metrics.totalOrders, metrics.previousPeriodOrders))}
            </span>
          </div>
          <div className="stat-value">{formatNumber(metrics.totalOrders)}</div>
          <div className="stat-label">Orders placed</div>
          {metrics.totalOrders === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>AVERAGE ORDER VALUE</span>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>—</span>
          </div>
          <div className="stat-value">{formatCurrency(metrics.avgOrderValue)}</div>
          <div className="stat-label">Per transaction</div>
          {metrics.avgOrderValue === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>TOTAL CUSTOMERS</span>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>—</span>
          </div>
          <div className="stat-value">{formatNumber(metrics.totalCustomers)}</div>
          <div className="stat-label">Active customers</div>
          {metrics.totalCustomers === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>AVG LIFETIME VALUE</span>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>—</span>
          </div>
          <div className="stat-value">{formatCurrency(metrics.avgLTV)}</div>
          <div className="stat-label">Predicted LTV</div>
          {metrics.avgLTV === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>GROWTH RATE</span>
            <span style={{ 
              fontSize: '12px', 
              color: metrics.growthRate >= 0 ? '#10b981' : '#ef4444', 
              fontWeight: '600' 
            }}>
              {formatPercentage(metrics.growthRate)}
            </span>
          </div>
          <div className="stat-value">{formatPercentage(metrics.growthRate)}</div>
          <div className="stat-label">Revenue growth</div>
          {metrics.growthRate === 0 && metrics.totalRevenue === 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
              No data available for this period
            </div>
          )}
        </div>
      </div>

      {/* Revenue Performance Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>Revenue Performance</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>Track revenue trends over time</p>
        {loading ? (
          <div style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            Loading chart data...
          </div>
        ) : metrics.revenueChart && metrics.revenueChart.length > 0 ? (
          <div style={{ width: '100%', height: '400px', padding: '16px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={metrics.revenueChart}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    try {
                      const date = new Date(value)
                      if (isNaN(date.getTime())) return value
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    } catch {
                      return value
                    }
                  }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                  labelFormatter={(label) => {
                    try {
                      const date = new Date(label)
                      if (isNaN(date.getTime())) return label
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    } catch {
                      return label
                    }
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5, fill: '#3B82F6' }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{
            minHeight: '400px',
            border: '2px dashed #e5e7eb',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            padding: '48px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              No Chart Data Available
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>
              {error || 'No revenue data for the selected period'}
            </p>
          </div>
        )}
      </div>

      {/* Order Metrics */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>Order Metrics</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>Detailed order and transaction insights</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>AVERAGE DAILY REVENUE</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatCurrency(0)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Last 30 days</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>PEAK REVENUE DAY</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatCurrency(0)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Best performing day</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>ORDER GROWTH</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatPercentage(0)}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Period over period</div>
          </div>
        </div>
      </div>

      {/* Ask AI - Conversational LLM */}
      {brandId && (
        <div style={{ marginBottom: '24px' }}>
          <AskAI brandId={brandId} dateRange={dateRange} />
        </div>
      )}

      {/* Advanced Analytics Links */}
      <div className="card">
        <h2>Advanced Analytics</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>Explore deeper insights and analysis</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Link href="/analytics/cohorts" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
              <h3 style={{ marginBottom: '8px' }}>Cohort Analysis</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                Customer retention by cohort
              </p>
              <div style={{ color: '#2563eb', fontWeight: '500', fontSize: '14px' }}>
                View →
              </div>
            </div>
          </Link>

          <Link href="/analytics/funnels" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
              <h3 style={{ marginBottom: '8px' }}>Funnel Analysis</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                Conversion funnel tracking
              </p>
              <div style={{ color: '#2563eb', fontWeight: '500', fontSize: '14px' }}>
                View →
              </div>
            </div>
          </Link>

          <Link href="/analytics/channels" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
              <h3 style={{ marginBottom: '8px' }}>Channel Attribution</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                Multi-channel performance
              </p>
              <div style={{ color: '#2563eb', fontWeight: '500', fontSize: '14px' }}>
                View →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
