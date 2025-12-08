import { cn } from '@/lib/utils/cn'

interface AlertProps {
  variant?: 'default' | 'warning' | 'error' | 'success' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'default', title, children, className }: AlertProps) {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    info: 'bg-gray-50 border-gray-200 text-gray-900',
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variants[variant],
        className
      )}
    >
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default Alert

