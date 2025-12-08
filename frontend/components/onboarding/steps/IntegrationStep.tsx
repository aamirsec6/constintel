// GENERATOR: ONBOARDING_SYSTEM
// Integration Setup step component

'use client'

import { useState } from 'react'
import Button from '../../ui/Button'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Integrations</h2>
        <p className="text-gray-600">
          Connect your ecommerce platforms and services. You can set these up later if needed.
        </p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'shopify', title: 'Shopify', description: 'Connect your Shopify store' },
          { key: 'woocommerce', title: 'WooCommerce', description: 'Connect your WooCommerce store' },
          { key: 'twilio', title: 'Twilio (WhatsApp)', description: 'Connect WhatsApp messaging' },
        ].map((integration) => (
          <div key={integration.key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{integration.title}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
              <Button
                type="button"
                variant={integrations[integration.key]?.enabled ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleIntegration(integration.key)}
              >
                {integrations[integration.key]?.enabled ? 'Connected' : 'Connect'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button type="submit" isLoading={loading}>
            Continue
          </Button>
        </div>
      </div>
    </form>
  )
}

