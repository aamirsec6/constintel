// GENERATOR: ANALYTICS_DASHBOARD
// Funnel analysis detail page
// HOW TO RUN: npm run dev, visit http://localhost:3001/analytics/funnels

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FunnelsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!storedUser || !accessToken) {
      router.push('/login')
      return
    }

    fetchFunnelData()
  }, [dateRange, router])

  const fetchFunnelData = async () => {
    setLoading(true)
    try {
      const brandId = localStorage.getItem('brandId') || 'test-brand'
      const accessToken = localStorage.getItem('accessToken')
      
      const response = await fetch(`${apiUrl}/api/analytics/funnels?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: {
          'x-brand-id': brandId,
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      }
    } catch (error: any) {
      console.error('Error fetching funnel data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading funnel analysis...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Funnel Analysis</h1>
          <p>Track conversion rates and drop-off points across customer journey stages</p>
        </div>
        <Link href="/analytics/dashboard" className="btn btn-secondary">
          ← Back to Analytics
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Date Range</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
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
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
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
        </div>
      </div>

      {/* Summary Metrics */}
      {data?.summary ? (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{data.summary.totalVisitors?.toLocaleString() || '0'}</div>
            <div className="stat-label">Total Visitors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.totalCustomers?.toLocaleString() || '0'}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.totalConversionRate?.toFixed(1) || '0.0'}%</div>
            <div className="stat-label">Overall Conversion</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.averageTimeToCustomer?.toFixed(1) || '0.0'} days</div>
            <div className="stat-label">Avg Time to Customer</div>
          </div>
        </div>
      ) : null}

      {/* Funnel Visualization */}
      {data?.stages && data.stages.length > 0 ? (
        <div className="card">
          <h2>Conversion Funnel</h2>
          <div style={{ marginTop: '24px' }}>
            {data.stages.map((stage: any, index: number) => {
              const percentage = data.stages[0]?.count > 0 
                ? (stage.count / data.stages[0].count) * 100 
                : 0
              return (
                <div key={index} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{stage.name}</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {stage.count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '32px',
                    background: '#e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          {data.summary?.biggestDropOff && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '14px', color: '#92400e' }}>
                <strong>Biggest Drop-off:</strong> {data.summary.biggestDropOff.stage} ({data.summary.biggestDropOff.rate.toFixed(1)}% lost)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Funnel Data Available
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Start ingesting events to see conversion funnel analysis
            </p>
            <Link href="/integrations" className="btn">
              Set Up Integrations
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
