'use client'

import { useParams, useRouter } from 'next/navigation'
import { VideoCall } from '@/components/video/VideoCall'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function VideoCallPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appointmentId, setAppointmentId] = useState<string>()
  
  const roomId = params?.roomId as string

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    // Get appointment ID from URL params if available
    const urlParams = new URLSearchParams(window.location.search)
    const aptId = urlParams.get('appointmentId')
    if (aptId) {
      setAppointmentId(aptId)
    }
  }, [status, router])

  const handleCallEnd = () => {
    // Redirect to dashboard after call ends
    router.push('/dashboard')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <p>ไม่พบรหัสห้อง</p>
        </div>
      </div>
    )
  }

  return (
    <VideoCall
      roomId={roomId}
      appointmentId={appointmentId}
      onCallEnd={handleCallEnd}
    />
  )
}