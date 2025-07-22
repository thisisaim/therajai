import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const createCallSchema = z.object({
  appointmentId: z.string().optional(),
  participantIds: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { appointmentId, participantIds } = createCallSchema.parse(body)

    // Generate unique room ID
    const roomId = uuidv4()

    // Create video call record
    const videoCall = await db.videoCall.create({
      data: {
        roomId,
        hostId: session.user.id,
        status: 'WAITING',
        participants: {
          participants: participantIds?.map(id => ({
            id,
            invited: true,
            invitedAt: new Date()
          })) || []
        },
        sessionId: appointmentId ? undefined : undefined // Will be linked later if appointment exists
      }
    })

    // If linked to an appointment, update the appointment with session link
    if (appointmentId) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          sessionLink: `/video-call/${roomId}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      roomId,
      videoCall,
      joinUrl: `/video-call/${roomId}`
    })

  } catch (error) {
    console.error('Create video call error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการโทร' },
      { status: 500 }
    )
  }
}