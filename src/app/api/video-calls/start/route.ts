import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const startCallSchema = z.object({
  roomId: z.string(),
  appointmentId: z.string().optional()
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
    const { roomId, appointmentId } = startCallSchema.parse(body)

    // Create or update video call record
    const videoCall = await db.videoCall.upsert({
      where: { roomId },
      update: {
        status: 'ACTIVE',
        startTime: new Date(),
        participants: {
          participants: [
            {
              id: session.user.id,
              name: session.user.name,
              role: session.user.role,
              joinedAt: new Date()
            }
          ]
        }
      },
      create: {
        roomId,
        hostId: session.user.id,
        status: 'ACTIVE',
        startTime: new Date(),
        participants: {
          participants: [
            {
              id: session.user.id,
              name: session.user.name,
              role: session.user.role,
              joinedAt: new Date()
            }
          ]
        }
      }
    })

    // If linked to an appointment, update the appointment
    if (appointmentId) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          sessionLink: `/video-call/${roomId}`,
          status: 'COMPLETED' // Mark as in progress
        }
      })
    }

    return NextResponse.json({
      success: true,
      videoCall
    })

  } catch (error) {
    console.error('Start video call error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเริ่มการโทร' },
      { status: 500 }
    )
  }
}