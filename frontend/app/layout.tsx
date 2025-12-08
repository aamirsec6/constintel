// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Next.js 14+ app directory structure
// HOW TO RUN: npm run dev

import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'ConstIntel - Unified Commerce Platform',
  description: 'Customer Intelligence & Omnichannel Analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ThemeToggle />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

