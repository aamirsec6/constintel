// GENERATOR: ANALYTICS_DASHBOARD
// Cohort analysis detail page
// HOW TO RUN: npm run dev, visit http://localhost:3001/analytics/cohorts

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CohortsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [cohortType, setCohortType] = useState<'acquisition' | 'first_purchase' | 'segment'>('acquisition')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    fetchCohortData()
  }, [cohortType, dateRange, router])

  const fetchCohortData = async () => {
    setLoading(true)
    try {
      const brandId = localStorage.getItem('brandId') || 'test-brand'
      const accessToken = localStorage.getItem('accessToken')
      
      const response = await fetch(`${apiUrl}/api/analytics/cohorts?type=${cohortType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
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
      console.error('Error fetching cohort data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading cohort analysis...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Cohort Analysis</h1>
          <p>Analyze customer cohorts by acquisition date, first purchase, and segments</p>
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
              Cohort Type:
            </label>
            <select
              value={cohortType}
              onChange={(e) => setCohortType(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="acquisition">Acquisition Cohorts</option>
              <option value="first_purchase">First Purchase Cohorts</option>
              <option value="segment">Segment Cohorts</option>
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
            <div className="stat-value">{data.summary.totalCohorts || '0'}</div>
            <div className="stat-label">Total Cohorts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.totalCustomers?.toLocaleString() || '0'}</div>
            <div className="stat-label">Total Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.averageRetention?.d30?.toFixed(1) || '0.0'}%</div>
            <div className="stat-label">Avg D30 Retention</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.summary.averageRetention?.d90?.toFixed(1) || '0.0'}%</div>
            <div className="stat-label">Avg D90 Retention</div>
          </div>
        </div>
      ) : null}

      {/* Cohort Table */}
      {data?.cohorts && data.cohorts.length > 0 ? (
        <div className="card">
          <h2>Cohort Retention Analysis</h2>
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Cohort</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>D0</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>D30</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>D60</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>D90</th>
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((cohort: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{cohort.name || cohort.cohort}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{cohort.size?.toLocaleString() || '0'}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{cohort.retention?.d0?.toFixed(1) || '0.0'}%</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{cohort.retention?.d30?.toFixed(1) || '0.0'}%</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{cohort.retention?.d60?.toFixed(1) || '0.0'}%</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{cohort.retention?.d90?.toFixed(1) || '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Cohort Data Available
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Cohort data will appear here when you have customer purchase history
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
