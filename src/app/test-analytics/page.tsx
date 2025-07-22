'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useClickTracking } from '@/hooks/useClickTracking'

export default function TestAnalyticsPage() {
  const [clickCount, setClickCount] = useState(0)
  const { trackCustomEvent, sessionId } = useClickTracking()

  const handleTestClick = () => {
    setClickCount(prev => prev + 1)
    trackCustomEvent({
      elementType: 'test-button',
      elementText: 'Test Click Button',
      elementId: 'test-button-' + Date.now()
    })
  }

  const handleCustomTrack = () => {
    trackCustomEvent({
      elementType: 'custom-event',
      elementText: 'Custom Tracked Event',
      elementId: 'custom-event-' + Date.now()
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Analytics Testing Page</CardTitle>
          <CardDescription>
            Test page to verify click tracking functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Session Info</h3>
              <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Click Counter</h3>
              <p className="text-sm text-gray-600 mb-4">
                Clicks recorded: {clickCount}
              </p>
              <Button onClick={handleTestClick} className="mr-4">
                Test Click Tracking
              </Button>
              <Button onClick={handleCustomTrack} variant="outline">
                Custom Event Track
              </Button>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">Auto-tracked Elements</h3>
              <p className="text-sm text-gray-600 mb-4">
                These elements should be automatically tracked:
              </p>
              <div className="space-x-2">
                <Button variant="default">Regular Button</Button>
                <Button variant="outline">Outline Button</Button>
                <a href="#" className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                  Link Button
                </a>
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold mb-2">Non-tracked Elements</h3>
              <p className="text-sm text-gray-600 mb-4">
                These elements should NOT be tracked:
              </p>
              <div className="space-x-2">
                <Button className="no-track" variant="destructive">
                  No Track Button
                </Button>
                <div className="inline-block px-4 py-2 bg-gray-500 text-white rounded no-track">
                  No Track Div
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold mb-2">Testing Instructions</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Click the buttons above to generate click events</li>
                <li>2. Go to <a href="/admin/analytics" className="text-blue-600 hover:underline">/admin/analytics</a> (admin only)</li>
                <li>3. Check if the click data appears in the dashboard</li>
                <li>4. Verify referrer tracking by coming from different pages</li>
                <li>5. Test UTM parameters by adding ?utm_source=test&utm_campaign=analytics</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}