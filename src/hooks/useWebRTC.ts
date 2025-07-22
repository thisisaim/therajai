'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'simple-peer'
import { io, Socket } from 'socket.io-client'

interface UseWebRTCProps {
  roomId: string
  userId: string
  userName: string
  isHost: boolean
}

interface Participant {
  id: string
  name: string
  peer: Peer.Instance
  stream?: MediaStream
}

export const useWebRTC = ({ roomId, userId, userName, isHost }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map())

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(`http://localhost:${process.env.SOCKET_PORT || 3001}`)
    
    socketRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to signaling server')
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from signaling server')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      return stream
    } catch (err) {
      setError('ไม่สามารถเข้าถึงกล้องและไมโครโฟนได้')
      console.error('Error accessing media devices:', err)
      return null
    }
  }, [])

  // Join video call room
  const joinRoom = useCallback(async () => {
    const stream = await getUserMedia()
    if (!stream || !socketRef.current) return

    // Join the room
    socketRef.current.emit('join-room', {
      roomId,
      userId,
      userName
    })

    // Handle new user joining
    socketRef.current.on('user-joined', ({ userId: newUserId, userName: newUserName }) => {
      console.log(`User ${newUserName} joined`)
      
      // Create peer connection for new user with ICE servers
      const peer = new Peer({
        initiator: isHost, // Host initiates connection
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Add TURN servers for production
            ...(process.env.NEXT_PUBLIC_TURN_URLS ? [{
              urls: process.env.NEXT_PUBLIC_TURN_URLS.split(','),
              username: process.env.NEXT_PUBLIC_TURN_USERNAME,
              credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
            }] : [])
          ]
        }
      })

      peer.on('signal', (signal) => {
        socketRef.current?.emit('signal', {
          signal,
          targetUserId: newUserId,
          roomId
        })
      })

      peer.on('stream', (remoteStream) => {
        setParticipants(prev => {
          const newParticipants = new Map(prev)
          const participant = newParticipants.get(newUserId)
          if (participant) {
            participant.stream = remoteStream
            newParticipants.set(newUserId, participant)
          }
          return newParticipants
        })
      })

      peer.on('error', (err) => {
        console.error('Peer connection error:', err)
      })

      const participant: Participant = {
        id: newUserId,
        name: newUserName,
        peer
      }

      setParticipants(prev => new Map(prev).set(newUserId, participant))
      peersRef.current.set(newUserId, peer)
    })

    // Handle receiving signals from other users
    socketRef.current.on('signal', ({ signal, fromUserId }) => {
      const peer = peersRef.current.get(fromUserId)
      if (peer) {
        peer.signal(signal)
      }
    })

    // Handle user leaving
    socketRef.current.on('user-left', ({ userId: leftUserId }) => {
      const peer = peersRef.current.get(leftUserId)
      if (peer) {
        peer.destroy()
        peersRef.current.delete(leftUserId)
      }
      
      setParticipants(prev => {
        const newParticipants = new Map(prev)
        newParticipants.delete(leftUserId)
        return newParticipants
      })
    })

  }, [roomId, userId, userName, isHost, getUserMedia])

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId, userId })
    }

    // Close all peer connections
    peersRef.current.forEach(peer => peer.destroy())
    peersRef.current.clear()

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    setParticipants(new Map())
  }, [roomId, userId, localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [localStream])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [localStream])

  // Share screen
  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      // Replace video track for all peers
      const videoTrack = screenStream.getVideoTracks()[0]
      peersRef.current.forEach(peer => {
        const sender = (peer as any)._pc?.getSenders().find((s: any) => 
          s.track && s.track.kind === 'video'
        )
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })

      // Update local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }

      // Handle screen share ending
      videoTrack.onended = () => {
        getUserMedia() // Go back to camera
      }

    } catch (err) {
      console.error('Error sharing screen:', err)
      setError('ไม่สามารถแชร์หน้าจอได้')
    }
  }, [getUserMedia])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom()
    }
  }, [leaveRoom])

  return {
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
  }
}