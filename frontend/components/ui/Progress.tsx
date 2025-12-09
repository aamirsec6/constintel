import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  indicatorClassName?: string
}

export function Progress({ value, max = 100, className, showLabel = false, indicatorClassName }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            indicatorClassName || 'bg-gradient-to-r from-blue-500 to-blue-600'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default Progress

