'use client'

import { ReactNode } from 'react'
import { useClickTracking } from '@/hooks/useClickTracking'

interface ClickTrackingProviderProps {
  children: ReactNode
  enabled?: boolean
}

export const ClickTrackingProvider = ({ 
  children, 
  enabled = true 
}: ClickTrackingProviderProps) => {
  useClickTracking({
    enabled,
    trackSpecificElements: [
      'button',
      'a',
      '[role="button"]',
      'input[type="submit"]',
      'input[type="button"]',
      '.btn',
      '.button',
      '.clickable'
    ],
    excludeElements: [
      '.no-track',
      '.admin-only',
      '[data-no-track]'
    ],
    batchSize: 10,
    flushInterval: 5000
  })

  return <>{children}</>
}