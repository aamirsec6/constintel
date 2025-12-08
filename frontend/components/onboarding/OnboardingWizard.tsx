// GENERATOR: ONBOARDING_SYSTEM
// Main onboarding wizard component
// Multi-step wizard for brand onboarding

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Card from '../ui/Card'
import BrandInfoStep from './steps/BrandInfoStep'
import ContactDetailsStep from './steps/ContactDetailsStep'
import IntegrationStep from './steps/IntegrationStep'
import ConfigurationStep from './steps/ConfigurationStep'
import ReviewStep from './steps/ReviewStep'
import ProvisioningStatus from './ProvisioningStatus'

const TOTAL_STEPS = 5
const PROVISIONING_STEP = 6

export default function OnboardingWizard({ initialStep = 1 }: { initialStep?: number }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isProvisioning, setIsProvisioning] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const getAuthHeaders = useCallback(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    const brandId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null
    return {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(brandId ? { 'x-brand-id': brandId } : {}),
    }
  }, [])

  const fetchState = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${apiUrl}/api/onboarding/state`, { headers })
      if (response.data?.success && response.data.data?.state) {
        const state = response.data.data.state
        setFormData(state.data || {})
        setCurrentStep(state.completed ? PROVISIONING_STEP : state.currentStep || initialStep)
        setIsProvisioning(state.completed)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load onboarding state')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, getAuthHeaders, initialStep])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  const updateStep = async (step: number, data: any, next = true) => {
    setLoading(true)
    setError('')

    try {
      const headers = getAuthHeaders()
      await axios.post(
        `${apiUrl}/api/onboarding/step/${step}`,
        data,
        {
          headers,
        }
      )

      setFormData((prev: any) => ({ ...prev, ...data }))

      if (next) {
        if (step === TOTAL_STEPS) {
          await completeOnboarding()
        } else {
          setCurrentStep(step + 1)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save step')
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    setError('')

    try {
      const headers = getAuthHeaders()
      await axios.post(
        `${apiUrl}/api/onboarding/complete`,
        {},
        {
          headers,
        }
      )

      setIsProvisioning(true)
      setCurrentStep(PROVISIONING_STEP)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    if (isProvisioning || currentStep === PROVISIONING_STEP) {
      return <ProvisioningStatus onComplete={() => router.push('/dashboard')} />
    }

    switch (currentStep) {
      case 1:
        return (
          <BrandInfoStep
            data={formData.brandInfo}
            onNext={(data) => updateStep(1, { brandInfo: data })}
            loading={loading}
          />
        )
      case 2:
        return (
          <ContactDetailsStep
            data={formData.contactDetails}
            onNext={(data) => updateStep(2, { contactDetails: data })}
            onBack={() => setCurrentStep(1)}
            loading={loading}
          />
        )
      case 3:
        return (
          <IntegrationStep
            data={formData.integrations}
            onNext={(data) => updateStep(3, { integrations: data })}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        )
      case 4:
        return (
          <ConfigurationStep
            data={formData.configuration}
            onNext={(data) => updateStep(4, { configuration: data })}
            onBack={() => setCurrentStep(3)}
            loading={loading}
          />
        )
      case 5:
        return (
          <ReviewStep
            data={formData}
            onComplete={completeOnboarding}
            onBack={() => setCurrentStep(4)}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  const displayStep = Math.min(currentStep, TOTAL_STEPS)
  const progressPct = Math.min(Math.round((displayStep / TOTAL_STEPS) * 100), 100)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Onboarding Wizard</h2>
          <p className="text-muted-foreground">Let’s get you set up in a few guided steps.</p>
        </div>
        <div className="text-sm font-medium text-primary">
          {progressPct}% Complete
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {displayStep} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted-foreground">
            {progressPct}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <Card padding="lg" className="shadow-xl border border-border/70 bg-card">
        {renderStep()}
      </Card>
    </div>
  )
}

