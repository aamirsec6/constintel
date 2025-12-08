// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/store/dashboard

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StoreOpsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const storeId = 'STORE001' // In production, get from auth/context

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Fetch store stats
    fetch(`${apiUrl}/api/store/dashboard/${storeId}`, {
      headers: { 'x-brand-id': 'rhino-9918' }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [storeId])

  if (loading) {
    return <div className="loading">Loading Store Dashboard...</div>
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Store Operations Dashboard</h1>
          <p>Real-time Store Performance & Customer Alerts</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.activeAlerts || 0}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeVisits || 0}</div>
          <div className="stat-label">Customers In Store</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.recentVisits || 0}</div>
          <div className="stat-label">Visits (24h)</div>
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <Link href="/store/alerts" className="btn" style={{ textAlign: 'center', display: 'block' }}>
            🔔 View Alerts
          </Link>
          <Link href="/store/lookup" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            🔍 Lookup Customer
          </Link>
          <Link href="/store/planogram" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            📊 Planogram Intelligence
          </Link>
        </div>
      </div>

      <div className="card">
        <h2>Active Customers</h2>
        {stats?.activeCustomers && stats.activeCustomers.length > 0 ? (
          <div style={{ marginTop: '16px' }}>
            {stats.activeCustomers.map((customer: any, idx: number) => (
              <div key={idx} className="profile-card" style={{ marginBottom: '12px' }}>
                <div className="profile-header">
                  <div>
                    <strong>Customer {customer.profileId?.slice(0, 8)}</strong>
                    {customer.hasAlert && <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Alert</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Checked in {new Date(customer.checkInAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '16px', color: '#666' }}>No active customers in store</p>
        )}
      </div>
    </div>
  )
}

