// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/store/alerts

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StoreAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const storeId = 'STORE001' // In production, get from auth/context

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    
    const fetchAlerts = () => {
      fetch(`${apiUrl}/api/stores/${storeId}/alerts/active`, {
        headers: { 'x-brand-id': 'rhino-9918' }
      })
        .then(res => res.json())
        .then(data => {
          setAlerts(data.data || [])
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }

    fetchAlerts()
    // Poll every 5 seconds for new alerts
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [storeId])

  const markAsViewed = async (alertId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    await fetch(`${apiUrl}/api/alerts/${alertId}/viewed`, {
      method: 'PATCH',
      headers: { 'x-brand-id': 'rhino-9918' }
    })
    // Refresh alerts
    const res = await fetch(`${apiUrl}/api/stores/${storeId}/alerts/active`, {
      headers: { 'x-brand-id': 'rhino-9918' }
    })
    const data = await res.json()
    setAlerts(data.data || [])
  }

  if (loading) {
    return <div className="loading">Loading Alerts...</div>
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Store Alerts</h1>
          <p>Real-time customer alerts for store staff</p>
        </div>
        <Link href="/store/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No Active Alerts</h3>
            <p>Alerts will appear here when high-intent customers visit the store</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {alerts.map((alert: any) => (
            <div key={alert.id} className="card" style={{ borderLeft: '4px solid #667eea' }}>
              <div className="profile-header">
                <div>
                  <h3 style={{ margin: 0 }}>{alert.title}</h3>
                  <p style={{ margin: '8px 0 0 0', color: '#666' }}>{alert.message}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => markAsViewed(alert.id)}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  Mark Viewed
                </button>
              </div>
              
              {alert.productIds && Array.isArray(alert.productIds) && alert.productIds.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Interested Products:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {alert.productIds.map((productId: string, idx: number) => (
                      <span key={idx} className="badge badge-info">{productId}</span>
                    ))}
                  </div>
                </div>
              )}

              {alert.profile && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Customer Info:</div>
                  <div style={{ fontSize: '14px' }}>
                    LTV: ${alert.profile.lifetimeValue || 0} | Orders: {alert.profile.totalOrders || 0}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

