'use client'

import { forwardRef, useEffect, useRef } from 'react'
import { VideoOff, MicOff, User } from 'lucide-react'

interface VideoTileProps {
  stream?: MediaStream | null
  name: string
  isLocal: boolean
  isVideoEnabled: boolean
  isMuted: boolean
}

export const VideoTile = forwardRef<HTMLVideoElement, VideoTileProps>(
  ({ stream, name, isLocal, isVideoEnabled, isMuted }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const actualRef = ref || videoRef

    useEffect(() => {
      if (actualRef && 'current' in actualRef && actualRef.current && stream) {
        actualRef.current.srcObject = stream
      }
    }, [stream, actualRef])

    return (
      <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
        {/* Video element */}
        {isVideoEnabled && stream ? (
          <video
            ref={actualRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            {isVideoEnabled ? (
              <VideoOff className="w-12 h-12 text-gray-400" />
            ) : (
              <div className="flex flex-col items-center">
                <User className="w-16 h-16 text-gray-400 mb-2" />
                <span className="text-gray-400 text-sm">กล้องปิดอยู่</span>
              </div>
            )}
          </div>
        )}

        {/* Overlay with name and status */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">
              {name}
            </span>
            <div className="flex items-center space-x-1">
              {!isVideoEnabled && (
                <VideoOff className="w-4 h-4 text-red-400" />
              )}
              {isMuted && (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Local video indicator */}
        {isLocal && (
          <div className="absolute top-2 right-2">
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
              คุณ
            </span>
          </div>
        )}

        {/* Speaking indicator */}
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse opacity-0" />
        </div>
      </div>
    )
  }
)

VideoTile.displayName = 'VideoTile'