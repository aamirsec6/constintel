// GENERATOR: ONBOARDING_SYSTEM
// Review and Confirm step component

'use client'

import Button from '../../ui/Button'
import { OnboardingLayout } from '../OnboardingLayout'

interface ReviewStepProps {
  data: any
  onComplete: () => void
  onBack: () => void
  loading: boolean
}

export default function ReviewStep({ data, onComplete, onBack, loading }: ReviewStepProps) {
  return (
    <OnboardingLayout
      title="Step 5 — Review & confirm"
      subtitle="Verify details before provisioning your workspace."
      onBack={onBack}
      onPrimary={onComplete}
      primaryLabel="Confirm & Start Provisioning"
      loading={loading}
      footerSlot="Provisioning takes 2-5 minutes. You’ll be redirected to a status page."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Brand Information</h3>
          <dl className="space-y-2 text-sm text-slate-200">
            <div className="flex items-start gap-2">
              <dt className="text-slate-500 w-28">Name</dt>
              <dd className="font-medium">{data.brandInfo?.name || 'N/A'}</dd>
            </div>
            {data.brandInfo?.domain && (
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">Domain</dt>
                <dd className="font-medium">{data.brandInfo.domain}</dd>
              </div>
            )}
            {data.brandInfo?.industry && (
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">Industry</dt>
                <dd className="font-medium capitalize">{data.brandInfo.industry}</dd>
              </div>
            )}
            {data.brandInfo?.companySize && (
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">Size</dt>
                <dd className="font-medium">{data.brandInfo.companySize}</dd>
              </div>
            )}
            {data.brandInfo?.description && (
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">About</dt>
                <dd className="font-medium">{data.brandInfo.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {data.contactDetails && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Contact Details</h3>
            <dl className="space-y-2 text-sm text-slate-200">
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-32">Contact Person</dt>
                <dd className="font-medium">{data.contactDetails.contactPerson || 'N/A'}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-32">Email</dt>
                <dd className="font-medium">{data.contactDetails.contactEmail || 'N/A'}</dd>
              </div>
              {data.contactDetails.phone && (
                <div className="flex items-start gap-2">
                  <dt className="text-slate-500 w-32">Phone</dt>
                  <dd className="font-medium">{data.contactDetails.phone}</dd>
                </div>
              )}
              {data.contactDetails.billingAddress && (
                <div className="flex items-start gap-2">
                  <dt className="text-slate-500 w-32">Billing Address</dt>
                  <dd className="font-medium whitespace-pre-line">{data.contactDetails.billingAddress}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {data.integrations && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Integrations</h3>
            <dl className="space-y-2 text-sm text-slate-200">
              {['shopify', 'woocommerce', 'twilio'].map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <dt className="text-slate-500 w-32 capitalize">{key}</dt>
                  <dd className="font-medium">
                    {data.integrations?.[key]?.enabled ? (
                      <span className="text-indigo-300">Enabled</span>
                    ) : (
                      <span className="text-slate-500">Not connected</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {data.configuration && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Configuration</h3>
            <dl className="space-y-2 text-sm text-slate-200">
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">Timezone</dt>
                <dd className="font-medium">{data.configuration.timezone || 'UTC'}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="text-slate-500 w-28">Currency</dt>
                <dd className="font-medium">{data.configuration.currency || 'USD'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}

