// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/profiles

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Get brand ID from localStorage (set after login) or use default
    const brandId = typeof window !== 'undefined' 
      ? (localStorage.getItem('brandId') || 'test-brand')
      : 'test-brand'
    
    fetch(`${apiUrl}/api/profiles?page=${page}&limit=20`, {
      headers: { 'x-brand-id': brandId }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfiles(data.data || [])
          setTotal(data.pagination?.total || 0)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching profiles:', err)
        setLoading(false)
      })
  }, [page])

  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    const identifiers = profile.identifiers || {}
    return (
      identifiers.email?.toLowerCase().includes(search) ||
      identifiers.phone?.includes(search) ||
      identifiers.loyalty_id?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profiles...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Customer Profiles</h1>
          <p>Unified customer profiles across all channels</p>
        </div>
        <Link href="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by email, phone, or loyalty ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      <div className="card">
        <h2>Profiles ({total})</h2>
        {filteredProfiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No profiles found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'No customer profiles have been created yet. Start by importing data or connecting integrations.'}
            </p>
          </div>
        ) : (
          <>
            <div className="profile-info" style={{ marginTop: '16px' }}>
              {filteredProfiles.map((profile) => {
                const identifiers = profile.identifiers || {}
                return (
                  <div key={profile.id} className="profile-card">
                    <div className="profile-header">
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '8px' }}>
                          Profile #{profile.id.slice(0, 8)}
                        </h3>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {identifiers.email && (
                            <div className="info-item">
                              <div className="info-label">Email</div>
                              <div className="info-value">{identifiers.email}</div>
                            </div>
                          )}
                          {identifiers.phone && (
                            <div className="info-item">
                              <div className="info-label">Phone</div>
                              <div className="info-value">{identifiers.phone}</div>
                            </div>
                          )}
                          {identifiers.loyalty_id && (
                            <div className="info-item">
                              <div className="info-label">Loyalty ID</div>
                              <div className="info-value">{identifiers.loyalty_id}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link href={`/customer/360?id=${profile.id}`} className="btn">
                        View 360 →
                      </Link>
                    </div>
                    <div className="profile-info">
                      <div className="info-item">
                        <div className="info-label">Profile Strength</div>
                        <div className="info-value">{profile.profileStrength || 0}%</div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${profile.profileStrength || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Lifetime Value</div>
                        <div className="info-value">
                          ${parseFloat(profile.lifetimeValue || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Total Orders</div>
                        <div className="info-value">{profile.totalOrders || 0}</div>
                      </div>
                      {profile.predictions && (
                        <div className="info-item">
                          <div className="info-label">Churn Risk</div>
                          <div className="info-value">
                            {profile.predictions.churnScore 
                              ? `${(profile.predictions.churnScore * 100).toFixed(0)}%`
                              : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {total > 20 && (
              <div style={{ 
                marginTop: '24px', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '8px' 
              }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

