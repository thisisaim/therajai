'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ClickTrackingProvider } from '@/components/ClickTrackingProvider'
import '@/lib/i18n' // Initialize i18n

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ClickTrackingProvider>
          {children}
        </ClickTrackingProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}