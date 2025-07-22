import { useEffect, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'

interface ClickData {
  elementType: string
  elementId?: string
  elementClass?: string
  elementText?: string
  pageUrl: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
}

interface UseClickTrackingOptions {
  enabled?: boolean
  trackAllClicks?: boolean
  trackSpecificElements?: string[] // CSS selectors
  excludeElements?: string[] // CSS selectors to exclude
  batchSize?: number
  flushInterval?: number
}

export const useClickTracking = (options: UseClickTrackingOptions = {}) => {
  const {
    enabled = true,
    trackAllClicks = false,
    trackSpecificElements = ['button', 'a', '[role="button"]'],
    excludeElements = ['.no-track'],
    batchSize = 10,
    flushInterval = 5000
  } = options

  const sessionId = useRef<string>()
  const clickBatch = useRef<ClickData[]>([])
  const batchTimer = useRef<NodeJS.Timeout>()

  // Initialize session ID
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = nanoid()
    }
  }, [])

  // Get URL parameters for UTM tracking
  const getUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return {}
    
    const urlParams = new URLSearchParams(window.location.search)
    return {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmContent: urlParams.get('utm_content') || undefined
    }
  }, [])

  // Flush batch to server
  const flushBatch = useCallback(async () => {
    if (clickBatch.current.length === 0) return

    const batchToSend = [...clickBatch.current]
    clickBatch.current = []

    try {
      for (const clickData of batchToSend) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId.current,
            ...clickData
          })
        })
      }
    } catch (error) {
      console.error('Failed to send click tracking data:', error)
      // Re-add failed clicks to batch for retry
      clickBatch.current.unshift(...batchToSend)
    }
  }, [])

  // Track a single click
  const trackClick = useCallback(async (element: HTMLElement) => {
    if (!enabled || !sessionId.current) return

    const clickData: ClickData = {
      elementType: element.tagName.toLowerCase(),
      elementId: element.id || undefined,
      elementClass: element.className || undefined,
      elementText: element.textContent?.trim().substring(0, 100) || undefined,
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
      ...getUrlParams()
    }

    // Add to batch
    clickBatch.current.push(clickData)

    // Flush if batch is full
    if (clickBatch.current.length >= batchSize) {
      await flushBatch()
    }
  }, [enabled, getUrlParams, flushBatch, batchSize])

  // Handle click events
  const handleClick = useCallback(async (event: MouseEvent) => {
    if (!enabled) return

    const target = event.target as HTMLElement
    if (!target) return

    // Check if element should be excluded
    const shouldExclude = excludeElements.some(selector => 
      target.closest(selector) !== null
    )
    if (shouldExclude) return

    // Check if element should be tracked
    const shouldTrack = trackAllClicks || trackSpecificElements.some(selector => 
      target.matches(selector) || target.closest(selector) !== null
    )
    
    if (shouldTrack) {
      await trackClick(target)
    }
  }, [enabled, excludeElements, trackAllClicks, trackSpecificElements, trackClick])

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('click', handleClick)
    
    // Set up batch flush timer
    if (batchTimer.current) {
      clearInterval(batchTimer.current)
    }
    
    batchTimer.current = setInterval(flushBatch, flushInterval)

    return () => {
      document.removeEventListener('click', handleClick)
      if (batchTimer.current) {
        clearInterval(batchTimer.current)
      }
    }
  }, [enabled, handleClick, flushBatch, flushInterval])

  // Flush on page unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      if (clickBatch.current.length > 0) {
        flushBatch()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, flushBatch])

  // Manual tracking function
  const trackCustomEvent = useCallback(async (customData: Partial<ClickData>) => {
    if (!enabled || !sessionId.current) return

    const clickData: ClickData = {
      elementType: 'custom',
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
      ...getUrlParams(),
      ...customData
    }

    clickBatch.current.push(clickData)

    if (clickBatch.current.length >= batchSize) {
      await flushBatch()
    }
  }, [enabled, getUrlParams, flushBatch, batchSize])

  return {
    trackCustomEvent,
    flushBatch,
    sessionId: sessionId.current
  }
}