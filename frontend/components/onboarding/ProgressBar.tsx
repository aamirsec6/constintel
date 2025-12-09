'use client'

import { Progress } from '@/components/ui/Progress'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPct = Math.min(Math.round((currentStep / totalSteps) * 100), 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{progressPct}%</span>
      </div>
      <Progress
        value={progressPct}
        className="h-2 bg-slate-800"
        indicatorClassName="bg-gradient-to-r from-indigo-500 via-indigo-400 to-blue-500"
      />
    </div>
  )
}

