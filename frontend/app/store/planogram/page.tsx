// GENERATOR: PLANOGRAM_INTELLIGENCE
// ASSUMPTIONS: Next.js app directory, API_URL in env, Recharts available
// HOW TO RUN: npm run dev, visit http://localhost:3001/store/planogram
//
// TODO: Future Enhancements
// - Integrate camera-based heatmap visualization for real-time foot traffic
// - Add real-time aisle footfall analytics dashboard with live sensor data
// - Implement ML model predictions display for optimal shelf placement
// - Build A/B testing interface to track planogram change effectiveness
// - Add interactive 3D store layout visualization with product placement recommendations

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PlanogramData {
  summary: {
    topCategories: Array<{
      category: string
      intentScore: number
      salesCount: number
      trend: 'up' | 'down' | 'stable'
    }>
    underperformingCategories: Array<{
      category: string
      intentScore: number
      salesCount: number
      gap: number
    }>
    risingInterest: Array<{
      productId: string
      productName: string
      trendDelta: number
      intentScore: number
    }>
  }
  recommendations: Array<{
    productId: string
    productName: string
    category: string
    onlineIntent: number
    storeSales: number
    intentScore: number
    recommendation: string
    priority: 'high' | 'medium' | 'low'
    planogramScore: number
  }>
  insights: {
    intentVsSales: Array<{
      productId: string
      intentScore: number
      salesCount: number
      gap: number
    }>
    categoryHeatmap: Array<{
      category: string
      intentScore: number
      salesCount: number
      visibilityScore: number
    }>
  }
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export default function PlanogramDashboard() {
  const [data, setData] = useState<PlanogramData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | ''>('')

  useEffect(() => {
    fetchPlanogramData()
  }, [storeId, category, priority])

  const fetchPlanogramData = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const params = new URLSearchParams()
      if (storeId) params.append('storeId', storeId)
      if (category) params.append('category', category)
      if (priority) params.append('priority', priority)

      const response = await fetch(`${apiUrl}/api/store/planogram?${params.toString()}`, {
        headers: {
          'x-brand-id': localStorage.getItem('brand_id') || 'rhino-9918',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch planogram data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch planogram data')
      }
    } catch (err: any) {
      console.error('Error fetching planogram data:', err)
      setError(err.message || 'Failed to load planogram data')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getIntentLevel = (score: number): string => {
    if (score >= 70) return 'Very High'
    if (score >= 50) return 'High'
    if (score >= 30) return 'Medium'
    return 'Low'
  }

  const getSalesLevel = (sales: number): string => {
    if (sales >= 20) return 'High'
    if (sales >= 10) return 'Medium'
    return 'Low'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      default:
        return '➡️'
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading Planogram Intelligence...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button
              className="btn"
              onClick={fetchPlanogramData}
              style={{ marginTop: '16px' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No planogram data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const intentVsSalesData = data.insights.intentVsSales.map(item => ({
    productId: item.productId.slice(0, 8),
    intent: item.intentScore,
    sales: item.salesCount,
    gap: item.gap,
  }))

  const categoryHeatmapData = data.insights.categoryHeatmap.map(item => ({
    category: item.category,
    intent: item.intentScore,
    sales: item.salesCount,
    visibility: item.visibilityScore,
  }))

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Planogram Intelligence</h1>
          <p>Data-driven product placement recommendations for retail stores</p>
        </div>
        <Link href="/store/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Store ID
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="Filter by store"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Filter by category"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Top Categories */}
        <div className="card">
          <h2>Top High-Intent Categories</h2>
          {data.summary.topCategories.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {data.summary.topCategories.map((cat, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{cat.category}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Intent: {cat.intentScore.toFixed(1)} | Sales: {cat.salesCount}
                      </div>
                    </div>
                    <span style={{ fontSize: '20px' }}>{getTrendIcon(cat.trend)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '16px' }}>No category data available</p>
          )}
        </div>

        {/* Underperforming Categories */}
        <div className="card">
          <h2>Underperforming Categories</h2>
          {data.summary.underperformingCategories.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {data.summary.underperformingCategories.map((cat, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ef4444',
                  }}
                >
                  <div>
                    <strong>{cat.category}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Intent: {cat.intentScore.toFixed(1)} | Sales: {cat.salesCount} | Gap: {cat.gap.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '16px' }}>No underperforming categories</p>
          )}
        </div>

        {/* Rising Interest */}
        <div className="card">
          <h2>Rising Interest Items</h2>
          {data.summary.risingInterest.length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {data.summary.risingInterest.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    borderLeft: '4px solid #10b981',
                  }}
                >
                  <div>
                    <strong>{item.productName}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Trend: +{item.trendDelta.toFixed(1)} | Intent: {item.intentScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '16px' }}>No rising interest items</p>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Intent vs Sales Chart */}
        <div className="card">
          <h2>Intent vs Sales</h2>
          <div style={{ marginTop: '16px', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={intentVsSalesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="intent"
                  name="Intent Score"
                  label={{ value: 'Intent Score', position: 'insideBottom', offset: -5 }}
                  stroke="#6b7280"
                />
                <YAxis
                  type="number"
                  dataKey="sales"
                  name="Sales Count"
                  label={{ value: 'Sales Count', angle: -90, position: 'insideLeft' }}
                  stroke="#6b7280"
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: string) => [value, name]}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Scatter name="Products" dataKey="sales" fill="#3b82f6">
                  {intentVsSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gap > 20 ? '#ef4444' : entry.gap < -20 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Heatmap (Bar Chart) */}
        <div className="card">
          <h2>Category Heatmap</h2>
          <div style={{ marginTop: '16px', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryHeatmapData.slice(0, 10)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="intent" fill="#3b82f6" name="Intent Score" />
                <Bar dataKey="sales" fill="#10b981" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="card">
        <h2>Product Recommendations</h2>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Showing {data.recommendations.length} of {data.pagination.total} recommendations
        </div>
        {data.recommendations.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  border: `2px solid ${getPriorityColor(rec.priority)}`,
                  borderRadius: '8px',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, marginBottom: '8px' }}>
                      {rec.productName} <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>(ID: {rec.productId})</span>
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      Category: {rec.category}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: getPriorityColor(rec.priority),
                      color: 'white',
                    }}
                  >
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Online Intent</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: rec.onlineIntent >= 50 ? '#10b981' : '#f59e0b' }}>
                      {getIntentLevel(rec.onlineIntent)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{rec.onlineIntent.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Store Sales</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: rec.storeSales >= 10 ? '#10b981' : '#f59e0b' }}>
                      {getSalesLevel(rec.storeSales)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{rec.storeSales} units</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Planogram Score</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b82f6' }}>
                      {rec.planogramScore.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${getPriorityColor(rec.priority)}`,
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Recommendation:</div>
                  <div style={{ fontSize: '14px', color: '#1a1a1a' }}>{rec.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No recommendations available</p>
          </div>
        )}
      </div>

      {/* TODO: Future Enhancements */}
      <div className="card" style={{ marginTop: '24px', background: '#f9fafb', border: '1px dashed #d1d5db' }}>
        <h3 style={{ color: '#666' }}>Future Enhancements (TODO)</h3>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#666' }}>
          <li>Camera-based heatmap integration for real-time foot traffic analysis</li>
          <li>Real-time aisle footfall analytics with sensor integration</li>
          <li>ML model to predict optimal shelf placement based on historical data</li>
          <li>A/B testing framework to measure planogram change effectiveness</li>
        </ul>
      </div>
    </div>
  )
}

