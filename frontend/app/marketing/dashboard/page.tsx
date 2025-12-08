// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Next.js app directory, API_URL in env
// HOW TO RUN: npm run dev, visit http://localhost:3001/marketing/dashboard

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MarketingDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    // Get brand ID from localStorage (set after login) or use default
    const brandId = typeof window !== 'undefined' 
      ? (localStorage.getItem('brandId') || 'test-brand')
      : 'test-brand'
    
    // Fetch marketing stats
    Promise.all([
      fetch(`${apiUrl}/api/campaign`, {
        headers: { 'x-brand-id': brandId }
      }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
      fetch(`${apiUrl}/api/automation`, {
        headers: { 'x-brand-id': brandId }
      }).catch(() => ({ json: () => ({ success: false, data: [] }) })),
    ])
      .then(async ([campaignsRes, automationsRes]) => {
        const campaigns = await campaignsRes.json()
        const automations = await automationsRes.json()
        
        setStats({
          totalCampaigns: campaigns.data?.length || 0,
          activeCampaigns: campaigns.data?.filter((c: any) => c.status === 'active').length || 0,
          totalAutomations: automations.data?.length || 0,
          activeAutomations: automations.data?.filter((a: any) => a.enabled).length || 0,
        })
        setLoading(false)
      })
      .catch(() => {
        // Use mock data if API fails
        setStats({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalAutomations: 0,
          activeAutomations: 0,
        })
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading Marketing Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Marketing Dashboard</h1>
          <p>Campaigns, Automations & Customer Engagement</p>
        </div>
        <Link href="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCampaigns || 0}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeCampaigns || 0}</div>
          <div className="stat-label">Active Campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalAutomations || 0}</div>
          <div className="stat-label">Total Automations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeAutomations || 0}</div>
          <div className="stat-label">Active Automations</div>
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <Link href="/marketing/campaigns" className="btn" style={{ textAlign: 'center', display: 'block' }}>
            📢 Manage Campaigns
          </Link>
          <Link href="/marketing/automation" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            ⚙️ Automation Builder
          </Link>
          <Link href="/profiles" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            👥 View Segments
          </Link>
          <Link href="/analytics/dashboard" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block' }}>
            📊 View Analytics
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <div className="card">
          <h2>Campaigns</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Create and manage marketing campaigns across multiple channels. Target specific customer segments and track performance.
          </p>
          <Link href="/marketing/campaigns" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            View All Campaigns →
          </Link>
        </div>

        <div className="card">
          <h2>Automations</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Set up automated marketing workflows based on customer behavior, ML predictions, and triggers.
          </p>
          <Link href="/marketing/automation" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            Build Automations →
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2>Marketing Channels</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Manage your marketing channels and integrations for seamless customer communication.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>WhatsApp</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Messaging</div>
          </div>
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Email</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Newsletters</div>
          </div>
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>SMS</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Text Messages</div>
          </div>
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Push</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Notifications</div>
          </div>
        </div>
        <Link href="/integrations" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Configure Channels →
        </Link>
      </div>
    </div>
  )
}

