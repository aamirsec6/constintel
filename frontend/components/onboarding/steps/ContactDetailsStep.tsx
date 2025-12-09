// GENERATOR: ONBOARDING_SYSTEM
// Contact Details step component

'use client'

import { useState } from 'react'
import Input from '../../ui/Input'
import { OnboardingLayout } from '../OnboardingLayout'

interface ContactDetailsStepProps {
  data?: {
    contactPerson?: string
    contactEmail?: string
    phone?: string
    billingAddress?: string
  }
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
}

export default function ContactDetailsStep({ data, onNext, onBack, loading }: ContactDetailsStepProps) {
  const [formData, setFormData] = useState({
    contactPerson: data?.contactPerson || '',
    contactEmail: data?.contactEmail || '',
    phone: data?.phone || '',
    billingAddress: data?.billingAddress || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required'
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Enter a valid email address'
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (validate()) {
      onNext(formData)
    }
  }

  return (
    <OnboardingLayout
      title="Step 2 — Contact details"
      subtitle="Additional contact information for your account."
      onBack={onBack}
      onPrimary={handleSubmit}
      primaryLabel="Continue"
      loading={loading}
      footerSlot="We’ll send account and billing notifications to this contact."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            error={errors.contactPerson}
            placeholder="John Doe"
            required
            helperText="Primary contact person"
            className="bg-slate-900 border-slate-800 text-white"
          />

          <Input
            label="Contact Email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            error={errors.contactEmail}
            placeholder="contact@brand.com"
            required
            helperText="For notifications and account updates"
            className="bg-slate-900 border-slate-800 text-white"
          />
        </div>

        <Input
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          placeholder="+1 (555) 123-4567"
          helperText="Optional: business phone number"
          className="bg-slate-900 border-slate-800 text-white"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Billing Address (optional)</label>
          <textarea
            value={formData.billingAddress}
            onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition placeholder:text-slate-500 resize-none"
            rows={3}
            placeholder="Street, City, State, Zip, Country"
          />
        </div>
      </form>
    </OnboardingLayout>
  )
}

