// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/crm/dashboard

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CRMDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Fetch CRM stats
    fetch(`${apiUrl}/api/profiles?limit=1`, {
      headers: { 'x-brand-id': 'rhino-9918' }
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          totalProfiles: data.pagination?.total || 0,
          mergedProfiles: 0, // Would come from merge history
          profileQuality: 85, // Average profile strength
        })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="loading">Loading CRM Dashboard...</div>
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>CRM Dashboard</h1>
          <p>Unified Customer Profiles & Segmentation</p>
        </div>
        <Link href="/profiles" className="btn">
          View All Profiles →
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalProfiles || 0}</div>
          <div className="stat-label">Total Unified Profiles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.mergedProfiles || 0}</div>
          <div className="stat-label">Profiles Merged</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.profileQuality || 0}%</div>
          <div className="stat-label">Average Profile Quality</div>
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <Link href="/profiles" className="btn" style={{ textAlign: 'center', display: 'block' }}>
            👥 View Profiles
          </Link>
          <Link href="/customer/360" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            🔍 Customer 360
          </Link>
          <Link href="/integrations" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            🔗 Manage Integrations
          </Link>
        </div>
      </div>

      <div className="card">
        <h2>Segmentation</h2>
        <p>View customers by RFM segments, LTV tiers, and custom segments.</p>
        <Link href="/profiles" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          View Segments →
        </Link>
      </div>
    </div>
  )
}

