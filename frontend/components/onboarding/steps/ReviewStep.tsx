// GENERATOR: ONBOARDING_SYSTEM
// Review and Confirm step component

'use client'

import Button from '../../ui/Button'

interface ReviewStepProps {
  data: any
  onComplete: () => void
  onBack: () => void
  loading: boolean
}

export default function ReviewStep({ data, onComplete, onBack, loading }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">Please review your information before we set up your infrastructure.</p>
      </div>

      <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Brand Information</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex">
              <dt className="text-gray-600 w-24">Name:</dt>
              <dd className="text-gray-900">{data.brandInfo?.name || 'N/A'}</dd>
            </div>
            {data.brandInfo?.domain && (
              <div className="flex">
                <dt className="text-gray-600 w-24">Domain:</dt>
                <dd className="text-gray-900">{data.brandInfo.domain}</dd>
              </div>
            )}
            {data.brandInfo?.industry && (
              <div className="flex">
                <dt className="text-gray-600 w-24">Industry:</dt>
                <dd className="text-gray-900">{data.brandInfo.industry}</dd>
              </div>
            )}
            {data.brandInfo?.companySize && (
              <div className="flex">
                <dt className="text-gray-600 w-24">Size:</dt>
                <dd className="text-gray-900">{data.brandInfo.companySize}</dd>
              </div>
            )}
            {data.brandInfo?.description && (
              <div className="flex">
                <dt className="text-gray-600 w-24">About:</dt>
                <dd className="text-gray-900">{data.brandInfo.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {data.contactDetails && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Contact Details</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex">
                <dt className="text-gray-600 w-32">Contact Person:</dt>
                <dd className="text-gray-900">{data.contactDetails.contactPerson || 'N/A'}</dd>
              </div>
              <div className="flex">
                <dt className="text-gray-600 w-32">Email:</dt>
                <dd className="text-gray-900">{data.contactDetails.contactEmail || 'N/A'}</dd>
              </div>
              {data.contactDetails.phone && (
                <div className="flex">
                  <dt className="text-gray-600 w-32">Phone:</dt>
                  <dd className="text-gray-900">{data.contactDetails.phone}</dd>
                </div>
              )}
              {data.contactDetails.billingAddress && (
                <div className="flex">
                  <dt className="text-gray-600 w-32">Billing Address:</dt>
                  <dd className="text-gray-900 whitespace-pre-line">{data.contactDetails.billingAddress}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {data.integrations && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Integrations</h3>
            <dl className="space-y-1 text-sm">
              {['shopify', 'woocommerce', 'twilio'].map((key) => (
                <div key={key} className="flex">
                  <dt className="text-gray-600 w-32 capitalize">{key}:</dt>
                  <dd className="text-gray-900">
                    {data.integrations?.[key]?.enabled ? 'Enabled' : 'Not connected'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {data.configuration && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex">
                <dt className="text-gray-600 w-24">Timezone:</dt>
                <dd className="text-gray-900">{data.configuration.timezone || 'UTC'}</dd>
              </div>
              <div className="flex">
                <dt className="text-gray-600 w-24">Currency:</dt>
                <dd className="text-gray-900">{data.configuration.currency || 'USD'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After you confirm, we'll provision your isolated infrastructure. 
          This process typically takes 2-5 minutes. You'll be redirected to a status page to track progress.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onComplete} isLoading={loading}>
          Confirm & Start Provisioning
        </Button>
      </div>
    </div>
  )
}

