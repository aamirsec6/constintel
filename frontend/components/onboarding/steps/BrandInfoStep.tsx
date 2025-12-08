// GENERATOR: ONBOARDING_SYSTEM
// Brand Information step component

'use client'

import { useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onNext(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Information</h2>
        <p className="text-gray-600">Tell us about your brand to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Brand Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g., Acme Inc"
          required
        />

        <Input
          label="Website Domain"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          error={errors.domain}
          placeholder="e.g., acme.com or shop.acme.co.in"
          helperText="Optional"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Size
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Briefly describe your business and key channels."
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={loading}>
          Continue
        </Button>
      </div>
    </form>
  )
}

