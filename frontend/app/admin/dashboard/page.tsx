'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>
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
          Admin Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/admin/brands" style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none'
          }}>
            Brands
          </Link>
          <Link href="/admin/market" style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none'
          }}>
            Market
          </Link>
          <button onClick={handleLogout} style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
          Platform Statistics
        </h2>

        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                Total Brands
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>
                {stats.brands.total}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                Active Brands
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                {stats.brands.active}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                Trial Brands
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
                {stats.brands.trial}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                Total Users
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>
                {stats.users.total}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                New Today
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
                {stats.brands.newToday}
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                New This Week
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
                {stats.brands.newThisWeek}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

