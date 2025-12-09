'use client'

import { ReactNode } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface OnboardingLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  onPrimary?: () => void
  primaryLabel?: string
  secondaryLabel?: string
  onSecondary?: () => void
  loading?: boolean
  footerSlot?: ReactNode
}

export function OnboardingLayout({
  title,
  subtitle,
  children,
  onBack,
  onPrimary,
  primaryLabel = 'Continue',
  secondaryLabel,
  onSecondary,
  loading,
  footerSlot,
}: OnboardingLayoutProps) {
  return (
    <Card className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/30">
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>

        <div className="h-px w-full bg-slate-800" />

        <div className="space-y-6">{children}</div>

        <div className="h-px w-full bg-slate-800" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {footerSlot || 'You can adjust these settings later in your workspace preferences.'}
          </div>
          <div className="flex w-full sm:w-auto justify-end gap-3">
            {onBack && (
              <Button variant="outline" type="button" onClick={onBack}>
                Back
              </Button>
            )}
            {onSecondary && secondaryLabel && (
              <Button variant="secondary" type="button" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            )}
            {onPrimary && (
              <Button
                type="button"
                onClick={onPrimary}
                isLoading={loading}
                className={cn(
                  'bg-gradient-to-r from-indigo-500 via-indigo-500 to-blue-500 text-white',
                  'hover:from-indigo-400 hover:to-blue-500 shadow-lg shadow-indigo-900/50'
                )}
              >
                {primaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

