'use client'

import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ThemeToggleButtonProps {
  className?: string
  variant?: 'icon' | 'button'
}

export function ThemeToggleButton({ className = '', variant = 'icon' }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={`
          p-2 rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-sm
          transition-all duration-200
          ${className}
        `}
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          px-4 py-2 rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-sm hover:shadow-md
          transition-all duration-200
          flex items-center gap-2
          text-sm font-medium
          text-gray-700 dark:text-gray-300
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          dark:focus:ring-offset-gray-800
          ${className}
        `}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <>
            <Moon className="w-4 h-4" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  )
}

