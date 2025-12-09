// GENERATOR: ONBOARDING_SYSTEM
// Configuration step component

'use client'

import { useState } from 'react'
import Input from '../../ui/Input'
import { OnboardingLayout } from '../OnboardingLayout'

interface ConfigurationStepProps {
  data?: {
    timezone?: string
    currency?: string
  }
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
}

export default function ConfigurationStep({ data, onNext, onBack, loading }: ConfigurationStepProps) {
  const [formData, setFormData] = useState({
    timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: data?.currency || 'USD',
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onNext(formData)
  }

  return (
    <OnboardingLayout
      title="Step 4 — Configure preferences"
      subtitle="Set your default timezone and currency."
      onBack={onBack}
      onPrimary={handleSubmit}
      primaryLabel="Continue"
      loading={loading}
      footerSlot="You can change these defaults later in workspace settings."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="AED">AED - UAE Dirham</option>
            </select>
          </div>
        </div>
      </form>
    </OnboardingLayout>
  )
}

