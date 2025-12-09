// GENERATOR: ONBOARDING_SYSTEM
// Brand Information step component

'use client'

import { useState } from 'react'
import Input from '../../ui/Input'
import { OnboardingLayout } from '../OnboardingLayout'

interface BrandInfoStepProps {
  data?: {
    name?: string
    domain?: string
    industry?: string
    companySize?: string
    description?: string
  }
  onNext: (data: any) => void
  loading: boolean
}

export default function BrandInfoStep({ data, onNext, loading }: BrandInfoStepProps) {
  const [formData, setFormData] = useState({
    name: data?.name || '',
    domain: data?.domain || '',
    industry: data?.industry || '',
    companySize: data?.companySize || '',
    description: data?.description || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required'
    }

    // Allow multi-level domains (e.g., example.co.in)
    if (formData.domain && !/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/.test(formData.domain)) {
      newErrors.domain = 'Please enter a valid domain'
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
      title="Step 1 — Tell us about your brand"
      subtitle="This helps us personalize your setup."
      onPrimary={handleSubmit}
      primaryLabel="Continue"
      loading={loading}
      footerSlot="We’ll tailor recommendations based on these details."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Brand Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Acme Inc"
            required
            className="bg-slate-900 border-slate-800 text-white"
          />

          <Input
            label="Website Domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            error={errors.domain}
            placeholder="shop.acme.com"
            helperText="Optional"
            className="bg-slate-900 border-slate-800 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
            >
              <option value="">Select an industry...</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="electronics">Electronics</option>
              <option value="food">Food & Beverage</option>
              <option value="beauty">Beauty & Cosmetics</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports & Outdoors</option>
              <option value="books">Books & Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Company Size</label>
            <select
              value={formData.companySize}
              onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
            >
              <option value="">Select company size...</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition placeholder:text-slate-500 resize-none"
            rows={4}
            placeholder="Briefly describe your business and key channels."
          />
        </div>
      </form>
    </OnboardingLayout>
  )
}

