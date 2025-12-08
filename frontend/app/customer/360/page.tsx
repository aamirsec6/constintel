// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/customer/360?id=profile-id

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default function Customer360Page() {
  const searchParams = useSearchParams()
  const profileId = searchParams.get('id')
  const [data, setData] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profileId) {
      setLoading(false)
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Get brand ID from localStorage (set after login) or use test brand UUID
    const brandId = typeof window !== 'undefined' 
      ? (localStorage.getItem('brandId') || '19354902-58de-47ad-bdde-0fcf17b68a56')
      : '19354902-58de-47ad-bdde-0fcf17b68a56'

    setLoading(true)
    setError(null)

    // Fetch 360 data
    fetch(`${apiUrl}/api/profiles/${profileId}/360`, {
      headers: { 'x-brand-id': brandId }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load customer data')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching customer 360:', err)
        setError('Failed to load customer data')
        setLoading(false)
      })

    // Fetch timeline data
    setLoadingTimeline(true)
    fetch(`${apiUrl}/api/profiles/${profileId}/timeline?limit=50`, {
      headers: { 'x-brand-id': brandId }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setTimeline(result.data || [])
        }
        setLoadingTimeline(false)
      })
      .catch(err => {
        console.error('Error fetching timeline:', err)
        setLoadingTimeline(false)
      })
  }, [profileId])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading Customer 360...</div>
      </div>
    )
  }

  if (!profileId) {
    return (
      <div className="container">
        <div className="header">
          <div>
            <h1>Customer 360</h1>
            <p>Unified customer view</p>
          </div>
          <Link href="/profiles" className="btn btn-secondary">
            ← Back to Profiles
          </Link>
        </div>
        <div className="card" style={{ marginTop: '24px', textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <h2 style={{ marginBottom: '12px', color: '#111827' }}>Select a Customer</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            To view a customer's 360 profile, please select a customer from the profiles page.
          </p>
          <Link href="/profiles" className="btn">
            View All Profiles →
          </Link>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container">
        <div className="header">
          <div>
            <h1>Customer 360</h1>
            <p>Unified customer view</p>
          </div>
          <Link href="/profiles" className="btn btn-secondary">
            ← Back to Profiles
          </Link>
        </div>
        <div className="card" style={{ marginTop: '24px', padding: '24px' }}>
          <div style={{ 
            background: '#fee2e2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '16px',
            color: '#991b1b'
          }}>
            <strong>Error:</strong> {error || 'Customer not found'}
          </div>
          <div style={{ marginTop: '16px' }}>
            <Link href="/profiles" className="btn">
              ← Back to Profiles
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { profile, predictions, features, productIntents, storeVisits, journey, campaignHistory, attribution, statistics } = data
  const identifiers = profile.identifiers || {}

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Customer 360</h1>
          <p>Complete unified view of customer across all channels</p>
        </div>
        <Link href="/profiles" className="btn btn-secondary">
          ← Back to Profiles
        </Link>
      </div>

      {/* Profile Overview */}
      <div className="card">
        <h2>Profile Overview</h2>
        <div className="profile-info">
          <div className="info-item">
            <div className="info-label">Profile ID</div>
            <div className="info-value">{profile.id}</div>
          </div>
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
        </div>
      </div>

      {/* Identifiers - Omnichannel Tracking */}
      <div className="card">
        <h2>Identifiers (Omnichannel Tracking)</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          These identifiers help us track this customer across all channels
        </p>
        <div className="profile-info">
          {identifiers.email && (
            <div className="info-item">
              <div className="info-label">📧 Email</div>
              <div className="info-value">{identifiers.email}</div>
            </div>
          )}
          {identifiers.phone && (
            <div className="info-item">
              <div className="info-label">📱 Phone</div>
              <div className="info-value">{identifiers.phone}</div>
            </div>
          )}
          {identifiers.loyalty_id && (
            <div className="info-item">
              <div className="info-label">🎫 Loyalty ID</div>
              <div className="info-value">{identifiers.loyalty_id}</div>
            </div>
          )}
          {identifiers.whatsapp && (
            <div className="info-item">
              <div className="info-label">💬 WhatsApp</div>
              <div className="info-value">{identifiers.whatsapp}</div>
            </div>
          )}
          {identifiers.device_id && (
            <div className="info-item">
              <div className="info-label">📱 Device ID</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{identifiers.device_id}</div>
            </div>
          )}
          {identifiers.cookie_id && (
            <div className="info-item">
              <div className="info-label">🍪 Cookie ID</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{identifiers.cookie_id}</div>
            </div>
          )}
          {identifiers.qr_id && (
            <div className="info-item">
              <div className="info-label">📷 QR ID</div>
              <div className="info-value">{identifiers.qr_id}</div>
            </div>
          )}
          {identifiers.upi && (
            <div className="info-item">
              <div className="info-label">💳 UPI ID</div>
              <div className="info-value">{identifiers.upi}</div>
            </div>
          )}
          {identifiers.card_last4 && (
            <div className="info-item">
              <div className="info-label">💳 Card Last 4</div>
              <div className="info-value">****{identifiers.card_last4}</div>
            </div>
          )}
          {Object.keys(identifiers).length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
              No identifiers found. This profile may need more events to collect identifiers.
            </div>
          )}
        </div>
      </div>

      {/* ML Predictions */}
      {predictions && (
        <div className="card">
          <h2>ML Predictions</h2>
          <div className="prediction-grid">
            {predictions.churnScore !== null && predictions.churnScore !== undefined && (
              <div className="prediction-item">
                <div className="prediction-label">Churn Risk</div>
                <div className="prediction-value">
                  {(predictions.churnScore * 100).toFixed(1)}%
                </div>
                <div className="progress-bar" style={{ marginTop: '8px' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${predictions.churnScore * 100}%`,
                      background: predictions.churnScore > 0.6 ? '#ef4444' : predictions.churnScore > 0.3 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>
            )}
            {(predictions.ltvScore !== null && predictions.ltvScore !== undefined) && (
              <div className="prediction-item">
                <div className="prediction-label">Predicted LTV</div>
                <div className="prediction-value">
                  ${typeof predictions.ltvScore === 'number' ? predictions.ltvScore.toFixed(2) : parseFloat(predictions.ltvScore || '0').toFixed(2)}
                </div>
              </div>
            )}
            {predictions.segment && (
              <div className="prediction-item">
                <div className="prediction-label">Segment</div>
                <div className="prediction-value" style={{ textTransform: 'capitalize' }}>
                  {predictions.segment.replace('_', ' ')}
                </div>
              </div>
            )}
            {predictions.recommendations && (
              <div className="prediction-item" style={{ gridColumn: 'span 2' }}>
                <div className="prediction-label">Recommendations</div>
                <div style={{ marginTop: '8px' }}>
                  {Array.isArray(predictions.recommendations) ? (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {predictions.recommendations.slice(0, 5).map((rec: any, i: number) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          {rec.productName || rec.productId || rec}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>{JSON.stringify(predictions.recommendations)}</div>
                  )}
                  </div>
        </div>
      )}
          </div>
        </div>
      )}

      {/* Product Intents */}
      {productIntents && productIntents.length > 0 && (
        <div className="card">
          <h2>Product Intent ({productIntents.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {productIntents.map((intent: any) => (
              <div key={intent.id} style={{ 
                padding: '16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                  {intent.productName || intent.productId}
                </div>
                {intent.category && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    {intent.category}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Intent Score</div>
                    <div style={{ fontWeight: '600' }}>{intent.intentScore}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Type</div>
                    <div style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                      {intent.intentType || 'N/A'}
                    </div>
                  </div>
                </div>
                {intent.lastSeenAt && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    Last seen: {format(new Date(intent.lastSeenAt), 'MMM d, yyyy')}
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Visits */}
      {storeVisits && storeVisits.length > 0 && (
        <div className="card">
          <h2>Store Visits ({storeVisits.length})</h2>
          <div style={{ marginTop: '16px' }}>
            {storeVisits.map((visit: any) => (
              <div key={visit.id} style={{ 
                padding: '16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {visit.storeName || visit.storeId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {format(new Date(visit.checkInAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    {visit.duration && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Duration: {visit.duration} minutes
                      </div>
                    )}
                  </div>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                    {visit.detectionMethod || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Journey */}
      {journey && (
        <div className="card">
          <h2>Customer Journey</h2>
          <div className="profile-info" style={{ marginTop: '16px' }}>
            <div className="info-item">
              <div className="info-label">Current Stage</div>
              <div className="info-value" style={{ textTransform: 'capitalize' }}>
                {journey.currentStage || 'N/A'}
              </div>
            </div>
            {journey.journeyScore !== null && journey.journeyScore !== undefined && (
              <div className="info-item">
                <div className="info-label">Journey Score</div>
                <div className="info-value">{journey.journeyScore.toFixed(1)}%</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${journey.journeyScore}%` }}
                  />
                </div>
              </div>
            )}
            {journey.nextBestAction && (
              <div className="info-item">
                <div className="info-label">Next Best Action</div>
                <div className="info-value">{journey.nextBestAction}</div>
              </div>
            )}
            {journey.nextMilestone && (
              <div className="info-item">
                <div className="info-label">Next Milestone</div>
                <div className="info-value">{journey.nextMilestone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaign History */}
      {campaignHistory && campaignHistory.length > 0 && (
        <div className="card">
          <h2>Campaign History ({campaignHistory.length})</h2>
          <div style={{ marginTop: '16px' }}>
            {campaignHistory.map((campaign: any, index: number) => (
              <div key={index} style={{ 
                padding: '16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600' }}>{campaign.campaignName}</div>
                  <span className={`badge ${
                    campaign.status === 'converted' ? 'badge-success' :
                    campaign.status === 'clicked' ? 'badge-info' :
                    campaign.status === 'opened' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Channel: {campaign.channel}
                </div>
                {campaign.sentAt && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Sent: {format(new Date(campaign.sentAt), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
                {campaign.convertedAt && (
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>
                    ✓ Converted: {format(new Date(campaign.convertedAt), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Omnichannel Timeline */}
      <div className="card">
        <h2>Omnichannel Timeline</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Complete interaction history across all channels
        </p>
        {loadingTimeline ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            Loading timeline...
          </div>
        ) : timeline.length > 0 ? (
          <div style={{ marginTop: '16px' }}>
            {timeline.map((item: any, index: number) => {
              const getChannelIcon = (type: string, eventType?: string) => {
                if (type === 'store_visit') return '🏪'
                if (type === 'campaign') return '📧'
                if (eventType?.includes('whatsapp')) return '💬'
                if (eventType?.includes('purchase') || eventType?.includes('pos')) return '🛒'
                if (eventType?.includes('page_view') || eventType?.includes('product_view')) return '🌐'
                if (eventType?.includes('cart')) return '🛍️'
                return '📱'
              }

              const getChannelName = (type: string, eventType?: string, channel?: string) => {
                if (type === 'store_visit') return 'Store Visit'
                if (type === 'campaign') return channel || 'Campaign'
                if (eventType?.includes('whatsapp')) return 'WhatsApp'
                if (eventType?.includes('purchase') || eventType?.includes('pos')) return 'Purchase'
                if (eventType?.includes('page_view')) return 'Page View'
                if (eventType?.includes('product_view')) return 'Product View'
                if (eventType?.includes('cart')) return 'Cart'
                return eventType || 'Event'
              }

              const getEventDescription = (item: any) => {
                if (item.type === 'store_visit') {
                  return `Visited ${item.storeName || item.storeId}`
                }
                if (item.type === 'campaign') {
                  return `${item.campaignName} - ${item.status}`
                }
                const payload = item.payload || {}
                if (payload.product_name) return `Viewed ${payload.product_name}`
                if (payload.order_number) return `Order ${payload.order_number} - $${payload.total_spent || payload.total || '0'}`
                if (payload.Body) return payload.Body.substring(0, 50)
                return item.eventType || 'Interaction'
              }

              return (
                <div key={item.id || index} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  borderLeft: '3px solid #e5e7eb',
                  marginBottom: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>
                    {getChannelIcon(item.type, item.eventType)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {getChannelName(item.type, item.eventType, item.channel)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                      {getEventDescription(item)}
                    </div>
                    {item.payload && Object.keys(item.payload).length > 0 && (
                      <details style={{ marginTop: '8px' }}>
                        <summary style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                          View details
                        </summary>
                        <pre style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
            No timeline events found
          </div>
        )}
      </div>

      {/* Omnichannel Statistics */}
      {statistics && (
        <div className="card">
          <h2>Omnichannel Statistics</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            Customer engagement across all channels
          </p>
          <div className="profile-info" style={{ marginTop: '16px' }}>
            <div className="info-item">
              <div className="info-label">Preferred Channel</div>
              <div className="info-value" style={{ textTransform: 'capitalize' }}>
                {statistics.preferredChannel || 'N/A'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Total Purchases</div>
              <div className="info-value">{statistics.totalPurchases || 0}</div>
            </div>
            <div className="info-item">
              <div className="info-label">WhatsApp Conversations</div>
              <div className="info-value">{statistics.totalConversations || 0}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Store Visits</div>
              <div className="info-value">{statistics.totalStoreVisits || 0}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Active Product Intents</div>
              <div className="info-value">{statistics.activeProductIntents || 0}</div>
            </div>
            {statistics.categoryAffinity && statistics.categoryAffinity.length > 0 && (
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <div className="info-label">Top Categories</div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {statistics.categoryAffinity.map((cat: any, i: number) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      background: '#f3f4f6',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#374151'
                    }}>
                      {cat.category} ({cat.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {features && features.length > 0 && (
        <div className="card">
          <h2>Features ({features.length})</h2>
          <div style={{ marginTop: '16px' }}>
            <div className="code-block" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {JSON.stringify(features, null, 2)}
              </pre>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}

