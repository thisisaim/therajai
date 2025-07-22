const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
})

// Store room information
const rooms = new Map()

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Join room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    console.log(`User ${userName} (${userId}) joining room ${roomId}`)
    
    socket.join(roomId)
    socket.userId = userId
    socket.userName = userName
    socket.roomId = roomId

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        createdAt: new Date()
      })
    }

    const room = rooms.get(roomId)
    room.participants.set(userId, {
      socketId: socket.id,
      userId,
      userName,
      joinedAt: new Date()
    })

    // Notify others in the room about new user
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      participantCount: room.participants.size
    })

    // Send current participants to new user
    const otherParticipants = Array.from(room.participants.values())
      .filter(p => p.userId !== userId)
    
    socket.emit('room-participants', otherParticipants)

    console.log(`Room ${roomId} now has ${room.participants.size} participants`)
  })

  // Handle signaling for WebRTC
  socket.on('signal', ({ signal, targetUserId, roomId }) => {
    console.log(`Relaying signal from ${socket.userId} to ${targetUserId}`)
    
    const room = rooms.get(roomId)
    if (room) {
      const targetParticipant = room.participants.get(targetUserId)
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('signal', {
          signal,
          fromUserId: socket.userId,
          fromUserName: socket.userName
        })
      }
    }
  })

  // Handle offer (WebRTC)
  socket.on('offer', ({ offer, targetUserId, roomId }) => {
    console.log(`Relaying offer from ${socket.userId} to ${targetUserId}`)
    
    const room = rooms.get(roomId)
    if (room) {
      const targetParticipant = room.participants.get(targetUserId)
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('offer', {
          offer,
          fromUserId: socket.userId,
          fromUserName: socket.userName
        })
      }
    }
  })

  // Handle answer (WebRTC)
  socket.on('answer', ({ answer, targetUserId, roomId }) => {
    console.log(`Relaying answer from ${socket.userId} to ${targetUserId}`)
    
    const room = rooms.get(roomId)
    if (room) {
      const targetParticipant = room.participants.get(targetUserId)
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('answer', {
          answer,
          fromUserId: socket.userId,
          fromUserName: socket.userName
        })
      }
    }
  })

  // Handle ICE candidates
  socket.on('ice-candidate', ({ candidate, targetUserId, roomId }) => {
    const room = rooms.get(roomId)
    if (room) {
      const targetParticipant = room.participants.get(targetUserId)
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('ice-candidate', {
          candidate,
          fromUserId: socket.userId
        })
      }
    }
  })

  // Leave room
  socket.on('leave-room', ({ roomId, userId }) => {
    console.log(`User ${userId} leaving room ${roomId}`)
    handleUserLeaving(socket, roomId, userId)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    
    if (socket.roomId && socket.userId) {
      handleUserLeaving(socket, socket.roomId, socket.userId)
    }
  })

  // Handle user leaving room
  function handleUserLeaving(socket, roomId, userId) {
    const room = rooms.get(roomId)
    if (room && room.participants.has(userId)) {
      room.participants.delete(userId)
      
      // Notify others about user leaving
      socket.to(roomId).emit('user-left', {
        userId,
        userName: socket.userName,
        participantCount: room.participants.size
      })

      socket.leave(roomId)

      // Clean up empty rooms
      if (room.participants.size === 0) {
        console.log(`Cleaning up empty room: ${roomId}`)
        rooms.delete(roomId)
      }

      console.log(`Room ${roomId} now has ${room.participants.size} participants`)
    }
  }

  // Room management
  socket.on('get-room-info', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (room) {
      socket.emit('room-info', {
        participantCount: room.participants.size,
        participants: Array.from(room.participants.values()),
        createdAt: room.createdAt
      })
    } else {
      socket.emit('room-info', {
        participantCount: 0,
        participants: [],
        createdAt: null
      })
    }
  })
})

const PORT = process.env.SOCKET_PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📺 Video calling service ready`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Socket.IO server...')
  httpServer.close(() => {
    console.log('Socket.IO server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Shutting down Socket.IO server...')
  httpServer.close(() => {
    console.log('Socket.IO server closed')
    process.exit(0)
  })
})