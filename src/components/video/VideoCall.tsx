'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useWebRTC } from '@/hooks/useWebRTC'
import { VideoControls } from './VideoControls'
import { VideoGrid } from './VideoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneOff } from 'lucide-react'

interface VideoCallProps {
  roomId: string
  appointmentId?: string
  onCallEnd?: () => void
}

export function VideoCall({ roomId, appointmentId, onCallEnd }: VideoCallProps) {
  const { data: session } = useSession()
  const [callStarted, setCallStarted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const {
    localStream,
    localVideoRef,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    shareScreen
  } = useWebRTC({
    roomId,
    userId: session?.user?.id || '',
    userName: session?.user?.name || '',
    isHost: session?.user?.role === 'THERAPIST'
  })

  // Track call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStarted) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStarted])

  // Start call
  const handleStartCall = async () => {
    setIsLoading(true)
    try {
      await joinRoom()
      setCallStarted(true)
      
      // Update video call status in database
      if (appointmentId) {
        await fetch('/api/video-calls/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            appointmentId
          })
        })
      }
    } catch (err) {
      console.error('Error starting call:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // End call
  const handleEndCall = async () => {
    setIsLoading(true)
    try {
      leaveRoom()
      setCallStarted(false)
      setCallDuration(0)
      
      // Update video call status in database
      if (appointmentId) {
        await fetch('/api/video-calls/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            duration: callDuration
          })
        })
      }
      
      onCallEnd?.()
    } catch (err) {
      console.error('Error ending call:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!session) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-600">กรุณาเข้าสู่ระบบเพื่อใช้งานการโทรวิดีโอ</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              โหลดหน้าใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!callStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center thai-font">
            {session.user.role === 'THERAPIST' ? 'เริ่มการให้คำปรึกษา' : 'เข้าร่วมการปรึกษา'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">รหัสห้อง:</p>
              <p className="font-mono text-lg font-semibold">{roomId}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {isConnected ? '✅ เชื่อมต่อแล้ว' : '⏳ กำลังเชื่อมต่อ...'}
              </p>
              {session.user.role === 'CLIENT' && (
                <p className="text-sm text-gray-500">
                  รอให้นักจิตวิทยาเริ่มการประชุม
                </p>
              )}
            </div>

            <Button
              onClick={handleStartCall}
              disabled={!isConnected || isLoading}
              className="w-full"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              {isLoading ? 'กำลังเชื่อมต่อ...' : 'เริ่มการโทร'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold thai-font">การปรึกษาออนไลน์</h2>
          <p className="text-sm text-gray-300">
            ระยะเวลา: {formatDuration(callDuration)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">
            ผู้เข้าร่วม: {participants.size + 1}
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <VideoGrid
          localVideoRef={localVideoRef}
          localStream={localStream}
          participants={participants}
          isVideoEnabled={isVideoEnabled}
          userName={session.user.name}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <VideoControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onShareScreen={shareScreen}
          onEndCall={handleEndCall}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}