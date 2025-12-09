// GENERATOR: ONBOARDING_SYSTEM
// Integration Setup step component

'use client'

import { useState } from 'react'
import Button from '../../ui/Button'
import { OnboardingLayout } from '../OnboardingLayout'

interface IntegrationStepProps {
  data?: any
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
}

export default function IntegrationStep({ data, onNext, onBack, loading }: IntegrationStepProps) {
  const [integrations, setIntegrations] = useState<any>(
    data || {
      shopify: { enabled: false },
      woocommerce: { enabled: false },
      twilio: { enabled: false },
    }
  )

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onNext(integrations)
  }

  const handleSkip = () => {
    onNext({})
  }

  const toggleIntegration = (key: string) => {
    setIntegrations((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key]?.enabled },
    }))
  }

  return (
    <OnboardingLayout
      title="Step 3 — Connect integrations"
      subtitle="Connect ecommerce, messaging, and marketing systems. You can do this later."
      onBack={onBack}
      onSecondary={handleSkip}
      secondaryLabel="Skip for now"
      onPrimary={handleSubmit}
      primaryLabel="Continue"
      loading={loading}
      footerSlot="You can always add or remove integrations later from settings."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'shopify', title: 'Shopify', description: 'Sync orders, customers, and products.', icon: '🛍️' },
          { key: 'woocommerce', title: 'WooCommerce', description: 'Connect your WooCommerce storefront.', icon: '🛒' },
          { key: 'twilio', title: 'Twilio (WhatsApp)', description: 'Send and receive WhatsApp messages.', icon: '💬' },
        ].map((integration) => {
          const isEnabled = integrations[integration.key]?.enabled
          return (
            <div
              key={integration.key}
              className={`
                rounded-xl border bg-slate-900/70 border-slate-800 px-4 py-4 transition-all duration-200
                ${isEnabled ? 'ring-1 ring-indigo-500/50 shadow-[0_10px_40px_-24px_rgba(99,102,241,0.6)]' : 'hover:border-slate-700'}
              `}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{integration.icon}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{integration.title}</h3>
                    <p className="text-xs text-slate-400">{integration.description}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isEnabled ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => toggleIntegration(integration.key)}
                  className={
                    isEnabled
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-none'
                      : ''
                  }
                >
                  {isEnabled ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          )
        })}
      </form>
    </OnboardingLayout>
  )
}

