'use client'

import { VideoTile } from './VideoTile'

interface Participant {
  id: string
  name: string
  stream?: MediaStream
}

interface VideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement>
  localStream: MediaStream | null
  participants: Map<string, Participant>
  isVideoEnabled: boolean
  userName: string
}

export function VideoGrid({
  localVideoRef,
  localStream,
  participants,
  isVideoEnabled,
  userName
}: VideoGridProps) {
  const participantArray = Array.from(participants.values())
  const totalParticipants = participantArray.length + 1 // +1 for local user

  // Calculate grid layout
  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count <= 4) return 'grid-cols-2 grid-rows-2'
    if (count <= 6) return 'grid-cols-3 grid-rows-2'
    return 'grid-cols-3 grid-rows-3'
  }

  const gridClass = getGridLayout(totalParticipants)

  return (
    <div className={`grid ${gridClass} gap-4 h-full`}>
      {/* Local video */}
      <VideoTile
        ref={localVideoRef}
        stream={localStream}
        name={`${userName} (คุณ)`}
        isLocal={true}
        isVideoEnabled={isVideoEnabled}
        isMuted={true} // Local video is always muted to prevent feedback
      />

      {/* Remote participants */}
      {participantArray.map((participant) => (
        <VideoTile
          key={participant.id}
          stream={participant.stream}
          name={participant.name}
          isLocal={false}
          isVideoEnabled={true}
          isMuted={false}
        />
      ))}
    </div>
  )
}