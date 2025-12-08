// GENERATOR: ONBOARDING_SYSTEM
// Main onboarding wizard page
// Redirects to appropriate step based on onboarding state

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (!storedUser || !accessToken) {
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading onboarding...</div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1100px' }}>
      <div className="header">
        <div>
          <h1>Welcome to ConstIntel</h1>
          <p>Let's get you set up in a few simple steps</p>
        </div>
      </div>

      <div className="card">
        <h2>Onboarding Wizard</h2>
        <OnboardingWizard initialStep={currentStep} />
      </div>
    </div>
  )
}
