import { cn } from '@/lib/utils/cn'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className={cn(
          'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {label && (
        <label className="text-sm font-medium text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  )
}

export default Checkbox

