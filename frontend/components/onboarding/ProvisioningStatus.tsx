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
        <h2 className="text-xl font-semibold text-foreground mb-2">Setting Up Your Infrastructure</h2>
        <p className="text-sm text-muted-foreground">
          We're provisioning your isolated environment. This typically takes 2-5 minutes.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className={`text-sm font-semibold ${getStatusColor(status.status)}`}>
            {status.progress || 0}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${status.progress || 0}%` }}
          />
        </div>
      </div>

      {status.steps && (
        <div className="space-y-2 mb-6">
          {status.steps.map((step: any, index: number) => (
            <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                step.status === 'completed'
                  ? 'bg-primary text-primary-foreground'
                  : step.status === 'in_progress'
                  ? 'bg-primary text-primary-foreground animate-pulse ring-2 ring-primary/20'
                  : step.status === 'failed'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}>
                {step.status === 'completed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'failed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-sm ${
                step.status === 'completed'
                  ? 'text-foreground'
                  : step.status === 'in_progress'
                  ? 'text-primary font-medium'
                  : step.status === 'failed'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {status.error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-400">{status.error}</p>
        </div>
      )}

      {status.status === 'completed' && (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Setup Complete!</h3>
          <p className="text-sm text-muted-foreground mb-4">Your infrastructure is ready. Redirecting to dashboard...</p>
          {status.apiKey && (
            <div className="bg-card border border-border rounded-lg p-4 inline-block text-left max-w-md">
              <p className="text-xs font-semibold text-foreground mb-1.5">API Key</p>
              <p className="text-xs font-mono break-all text-muted-foreground bg-muted/50 p-2 rounded border border-border">{status.apiKey}</p>
            </div>
          )}
          {status.instanceId && (
            <p className="text-sm text-muted-foreground mt-3">Instance: {status.instanceId}</p>
          )}
        </div>
      )}
    </Card>
  )
}

