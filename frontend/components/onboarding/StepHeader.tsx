'use client'

import { cn } from '@/lib/utils/cn'
import { Check, Building2, User, PlugZap, Settings2, ClipboardList } from 'lucide-react'

interface StepHeaderProps {
  currentStep: number
  steps: { number: number; label: string; description?: string }[]
}

const icons = {
  1: Building2,
  2: User,
  3: PlugZap,
  4: Settings2,
  5: ClipboardList,
}

export function StepHeader({ currentStep, steps }: StepHeaderProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 md:p-5 shadow-md shadow-slate-950/30">
      <div className="flex items-center justify-between">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const Icon = icons[step.number as keyof typeof icons] || ClipboardList

          return (
            <div key={step.number} className="flex-1 flex items-center gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200',
                  isCompleted
                    ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-100'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-500/25 text-indigo-50 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="hidden md:block">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    isCurrent ? 'text-white' : isCompleted ? 'text-indigo-100' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

