'use client'

import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="
          fixed top-4 right-4 z-50
          p-3 rounded-full
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-lg
          transition-all duration-200
        "
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-4 right-4 z-50
        p-3 rounded-full
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-lg hover:shadow-xl
        transition-all duration-200
        hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        dark:focus:ring-offset-gray-800
      "
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

