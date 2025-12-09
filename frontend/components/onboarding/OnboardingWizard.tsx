// GENERATOR: ONBOARDING_SYSTEM
// Main onboarding wizard component
// Multi-step wizard for brand onboarding

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import BrandInfoStep from './steps/BrandInfoStep'
import ContactDetailsStep from './steps/ContactDetailsStep'
import IntegrationStep from './steps/IntegrationStep'
import ConfigurationStep from './steps/ConfigurationStep'
import ReviewStep from './steps/ReviewStep'
import ProvisioningStatus from './ProvisioningStatus'
import { StepHeader } from './StepHeader'
import { ProgressBar } from './ProgressBar'

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

  const steps = [
    { number: 1, label: 'Brand Info', description: 'Basics about your brand' },
    { number: 2, label: 'Contact', description: 'Owner & billing details' },
    { number: 3, label: 'Integrations', description: 'Connect your stack' },
    { number: 4, label: 'Config', description: 'Timezone & currency' },
    { number: 5, label: 'Review', description: 'Confirm & provision' },
  ]

  return (
    <div className="space-y-6">
      <StepHeader currentStep={displayStep} steps={steps} />
      <ProgressBar currentStep={displayStep} totalSteps={TOTAL_STEPS} />

      {error && (
        <div className="p-3 bg-red-950/30 border border-red-900/70 text-sm text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-transparent rounded-3xl -z-10" />
        <div className="relative">{renderStep()}</div>
      </div>
    </div>
  )
}

