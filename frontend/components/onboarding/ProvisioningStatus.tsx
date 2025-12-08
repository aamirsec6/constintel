// GENERATOR: ONBOARDING_SYSTEM
// Provisioning status component with real-time updates

'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface ProvisioningStatusProps {
  onComplete: () => void
}

export default function ProvisioningStatus({ onComplete }: ProvisioningStatusProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const brandId = localStorage.getItem('brandId')
        if (!token) return

        const response = await axios.get(`${apiUrl}/api/provisioning/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(brandId ? { 'x-brand-id': brandId } : {}),
          },
        })

      if (response.data.success) {
          setStatus(response.data.data)
          
          if (response.data.data?.status === 'completed') {
            setTimeout(() => {
              onComplete()
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Failed to fetch provisioning status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()

    // Poll every 3 seconds for status updates
    const interval = setInterval(fetchStatus, 3000)

    return () => clearInterval(interval)
  }, [apiUrl, onComplete])

  if (loading && !status) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading provisioning status...</p>
      </div>
    )
  }

  if (!status) {
    return (
      <Card padding="lg">
        <div className="text-center py-12">
          <p className="text-gray-600">No provisioning in progress.</p>
          <Button onClick={onComplete} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </Card>
    )
  }

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Card padding="lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting Up Your Infrastructure</h2>
        <p className="text-gray-600">
          We're provisioning your isolated environment. This typically takes 2-5 minutes.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-semibold ${getStatusColor(status.status)}`}>
            {status.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${status.progress || 0}%` }}
          />
        </div>
      </div>

      {status.steps && (
        <div className="space-y-3 mb-6">
          {status.steps.map((step: any, index: number) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : step.status === 'in_progress'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : step.status === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : index + 1}
              </div>
              <span className={`text-sm ${
                step.status === 'completed'
                  ? 'text-green-600'
                  : step.status === 'in_progress'
                  ? 'text-blue-600 font-medium'
                  : step.status === 'failed'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {status.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{status.error}</p>
        </div>
      )}

      {status.status === 'completed' && (
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Setup Complete!</h3>
          <p className="text-gray-600 mb-4">Your infrastructure is ready. Redirecting to dashboard...</p>
          {status.apiKey && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block text-left">
              <p className="text-sm font-semibold text-gray-800 mb-1">API Key</p>
              <p className="text-xs font-mono break-all text-gray-700">{status.apiKey}</p>
            </div>
          )}
          {status.instanceId && (
            <p className="text-sm text-gray-600 mt-3">Instance: {status.instanceId}</p>
          )}
        </div>
      )}
    </Card>
  )
}

