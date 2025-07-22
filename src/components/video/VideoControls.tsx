'use client'

import { Button } from '@/components/ui/button'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor,
  Settings,
  MessageSquare
} from 'lucide-react'

interface VideoControlsProps {
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  onToggleVideo: () => void
  onToggleAudio: () => void
  onShareScreen: () => void
  onEndCall: () => void
  isLoading?: boolean
}

export function VideoControls({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onShareScreen,
  onEndCall,
  isLoading = false
}: VideoControlsProps) {
  return (
    <div className="flex justify-center items-center space-x-4">
      {/* Audio Toggle */}
      <Button
        onClick={onToggleAudio}
        variant={isAudioEnabled ? "default" : "outline"}
        size="lg"
        className="rounded-full w-12 h-12 p-0"
        disabled={isLoading}
      >
        {isAudioEnabled ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </Button>

      {/* Video Toggle */}
      <Button
        onClick={onToggleVideo}
        variant={isVideoEnabled ? "default" : "outline"}
        size="lg"
        className="rounded-full w-12 h-12 p-0"
        disabled={isLoading}
      >
        {isVideoEnabled ? (
          <Video className="w-6 h-6" />
        ) : (
          <VideoOff className="w-6 h-6" />
        )}
      </Button>

      {/* Screen Share */}
      <Button
        onClick={onShareScreen}
        variant="outline"
        size="lg"
        className="rounded-full w-12 h-12 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
        disabled={isLoading}
      >
        <Monitor className="w-6 h-6" />
      </Button>

      {/* Chat (placeholder for future feature) */}
      <Button
        variant="outline"
        size="lg"
        className="rounded-full w-12 h-12 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
        disabled={isLoading}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Settings (placeholder for future feature) */}
      <Button
        variant="outline"
        size="lg"
        className="rounded-full w-12 h-12 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
        disabled={isLoading}
      >
        <Settings className="w-6 h-6" />
      </Button>

      {/* End Call */}
      <Button
        onClick={onEndCall}
        variant="outline"
        size="lg"
        className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700"
        disabled={isLoading}
      >
        <PhoneOff className="w-6 h-6" />
      </Button>
    </div>
  )
}