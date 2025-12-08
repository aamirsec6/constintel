// GENERATOR: DASHBOARD
// Main dashboard page for brand users
// HOW TO RUN: npm run dev, visit http://localhost:3001/dashboard

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!storedUser || !accessToken) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)
    } catch (e) {
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const brandId = user.brandId || localStorage.getItem('brandId') || ''

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Brand: {brandId || 'N/A'}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              localStorage.removeItem('user')
              localStorage.removeItem('brandId')
              router.push('/login')
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">$0</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Automations</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <Link href="/profiles" className="btn" style={{ textAlign: 'center', display: 'block' }}>
            👥 View Profiles
          </Link>
          <Link href="/customer/360" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            🔍 Customer 360
          </Link>
          <Link href="/marketing/dashboard" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            📢 Marketing
          </Link>
          <Link href="/integrations" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            🔗 Integrations
          </Link>
        </div>
      </div>

      {/* Main Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <Link href="/profiles" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h2>Customer Profiles</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              View and manage comprehensive customer profiles with unified data from all channels.
            </p>
            <div style={{ color: '#2563eb', fontWeight: '500' }}>
              View Profiles →
            </div>
          </div>
        </Link>

        <Link href="/marketing/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h2>Marketing</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Create campaigns, set up automations, and track marketing performance.
            </p>
            <div style={{ color: '#2563eb', fontWeight: '500' }}>
              Go to Marketing →
            </div>
          </div>
        </Link>

        <Link href="/analytics/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h2>Analytics</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Funnels, cohorts, predictions, and advanced analytics insights.
            </p>
            <div style={{ color: '#2563eb', fontWeight: '500' }}>
              View Analytics →
            </div>
          </div>
        </Link>

        <Link href="/integrations" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
            <h2>Integrations</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Connect and manage integrations with external platforms.
            </p>
            <div style={{ color: '#2563eb', fontWeight: '500' }}>
              Manage Integrations →
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

