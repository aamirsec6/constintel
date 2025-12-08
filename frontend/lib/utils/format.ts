// Data formatting utilities for professional data presentation

/**
 * Format currency values
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'USD',
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') {
    return `$0.00`
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return `$0.00`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue)
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0'
  }

  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(decimals)}B`
  }

  if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(decimals)}M`
  }

  if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(decimals)}K`
  }

  return numValue.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals: number = 1,
  showSign: boolean = true
): string {
  if (value === null || value === undefined || value === '') {
    return '0%'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0%'
  }

  const formatted = numValue.toFixed(decimals)
  const sign = showSign && numValue > 0 ? '+' : ''

  return `${sign}${formatted}%`
}

/**
 * Format date values
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'medium' | 'long' | 'full' | 'iso' | 'relative' = 'medium'
): string {
  if (!date) {
    return 'N/A'
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

    case 'medium':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

    case 'full':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

    case 'iso':
      return dateObj.toISOString()

    case 'relative':
      return formatRelativeTime(dateObj)

    default:
      return dateObj.toLocaleDateString('en-US')
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'Just now'
  }

  if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
  }

  if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
  }

  if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
  }

  return formatDate(date, 'short')
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0'
  }

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format duration (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  if (secs > 0 && hours === 0) {
    parts.push(`${secs}s`)
  }

  return parts.join(' ') || '0s'
}

/**
 * Get color class for trend values
 */
export function getTrendColor(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'text-gray-500'
  }

  if (value > 0) {
    return 'text-green-600'
  }

  if (value < 0) {
    return 'text-red-600'
  }

  return 'text-gray-500'
}

/**
 * Get trend icon
 */
export function getTrendIcon(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '→'
  }

  if (value > 0) {
    return '↑'
  }

  if (value < 0) {
    return '↓'
  }

  return '→'
}

/**
 * Format data size (bytes)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

