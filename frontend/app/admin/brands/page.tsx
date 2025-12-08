'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function AdminBrands() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await axios.get(`${apiUrl}/api/admin/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setBrands(response.data.data.brands || [])
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (brandId: string) => {
    if (!confirm('Are you sure you want to suspend this brand?')) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(`${apiUrl}/api/admin/brands/${brandId}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBrands()
    } catch (error) {
      alert('Failed to suspend brand')
    }
  }

  const handleActivate = async (brandId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.post(`${apiUrl}/api/admin/brands/${brandId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBrands()
    } catch (error) {
      alert('Failed to activate brand')
    }
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
          Brands Management
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
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Brand Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Domain</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Plan</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Created</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <Link href={`/admin/brands/${brand.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {brand.name}
                    </Link>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>{brand.domain || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: brand.plan === 'enterprise' ? '#7c3aed' : brand.plan === 'pro' ? '#2563eb' : '#6b7280',
                      color: 'white'
                    }}>
                      {brand.plan}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: brand.status === 'active' ? '#10b981' : brand.status === 'trial' ? '#f59e0b' : '#ef4444',
                      color: 'white'
                    }}>
                      {brand.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#6b7280' }}>
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {brand.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(brand.id)}
                        style={{
                          padding: '4px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(brand.id)}
                        style={{
                          padding: '4px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

