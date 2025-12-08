// GENERATOR: ONBOARDING_SYSTEM
// Contact Details step component

'use client'

import { useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onNext(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Details</h2>
        <p className="text-gray-600">Additional contact information for your account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Contact Person"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          error={errors.contactPerson}
          placeholder="e.g., John Doe"
          required
          helperText="Primary contact person"
        />

        <Input
          label="Contact Email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          error={errors.contactEmail}
          placeholder="contact@brand.com"
          required
          helperText="For notifications and account updates"
        />
      </div>

      <Input
        label="Phone Number"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        error={errors.phone}
        placeholder="e.g., +1 (555) 123-4567"
        helperText="Optional: Business phone number"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Billing Address (optional)
        </label>
        <textarea
          value={formData.billingAddress}
          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Street, City, State, Zip, Country"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" isLoading={loading}>
          Continue
        </Button>
      </div>
    </form>
  )
}

