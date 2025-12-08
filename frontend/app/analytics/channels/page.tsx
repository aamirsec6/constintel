// GENERATOR: ANALYTICS_DASHBOARD
// Channel attribution detail page
// HOW TO RUN: npm run dev, visit http://localhost:3001/analytics/channels

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChannelsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [attributionModel, setAttributionModel] = useState<'first_touch' | 'last_touch' | 'linear' | 'time_decay'>('last_touch')
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

    fetchChannelData()
  }, [attributionModel, dateRange, router])

  const fetchChannelData = async () => {
    setLoading(true)
    try {
      const brandId = localStorage.getItem('brandId') || 'test-brand'
      const accessToken = localStorage.getItem('accessToken')
      
      const response = await fetch(`${apiUrl}/api/analytics/channels?model=${attributionModel}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
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
      console.error('Error fetching channel data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading channel attribution...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Channel Attribution</h1>
          <p>Analyze multi-channel performance and customer acquisition</p>
        </div>
        <Link href="/analytics/dashboard" className="btn btn-secondary">
          ← Back to Analytics
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Filters</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Attribution Model:
            </label>
            <select
              value={attributionModel}
              onChange={(e) => setAttributionModel(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="first_touch">First Touch</option>
              <option value="last_touch">Last Touch</option>
              <option value="linear">Linear</option>
              <option value="time_decay">Time Decay</option>
            </select>
          </div>
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
            <div className="stat-value">
              ${data.summary.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.totalCustomers?.toLocaleString() || '0'}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.topChannel?.name || 'N/A'}</div>
            <div className="stat-label">Top Channel</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '24px' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
            No channel data available for the selected date range.
          </p>
        </div>
      )}

      {/* Channel Table */}
      {data?.channels && data.channels.length > 0 ? (
        <div className="card">
          <h2>Channel Performance</h2>
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Channel</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Customers</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Avg Order Value</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((channel: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{channel.channel}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      ${channel.revenue?.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {channel.customers?.acquired?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      ${channel.avgOrderValue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {channel.conversionRate?.toFixed(1) || '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
            No channel data available. Start ingesting events to see channel attribution.
          </p>
        </div>
      )}
    </div>
  )
}
