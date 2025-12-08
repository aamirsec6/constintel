'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface MarketBrand {
  id: string
  name: string
  symbol: string
  score: number
  change: number
  changeType: 'up' | 'down' | 'stable'
  trend: 'up' | 'down' | 'stable'
  volume: number
}

export default function AdminMarket() {
  const [marketData, setMarketData] = useState<{ brands: MarketBrand[], platformAverage: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMarketData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${apiUrl}/api/admin/market`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setMarketData(response.data.data)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>
  }

  const getChangeColor = (changeType: string) => {
    if (changeType === 'up') return '#10b981'
    if (changeType === 'down') return '#ef4444'
    return '#6b7280'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↑'
    if (trend === 'down') return '↓'
    return '→'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          Brand Performance Market
        </h1>
        <Link href="/admin/dashboard" style={{
          padding: '8px 16px',
          background: '#6b7280',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none'
        }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {marketData?.platformAverage && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '32px'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
              Platform Average Performance Score
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#111827' }}>
                {marketData.platformAverage.score.toFixed(2)}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: getChangeColor(marketData.platformAverage.change > 0 ? 'up' : marketData.platformAverage.change < 0 ? 'down' : 'stable')
              }}>
                {marketData.platformAverage.change > 0 ? '+' : ''}{marketData.platformAverage.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {marketData?.brands.map((brand) => (
            <div
              key={brand.id}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    {brand.symbol}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {brand.name}
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  color: getChangeColor(brand.changeType)
                }}>
                  {getTrendIcon(brand.trend)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                  {brand.score.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: getChangeColor(brand.changeType),
                  fontWeight: '600'
                }}>
                  {brand.change > 0 ? '+' : ''}{brand.change.toFixed(2)}%
                </div>
              </div>

              <div style={{
                padding: '8px 12px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Customers: {brand.volume.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

