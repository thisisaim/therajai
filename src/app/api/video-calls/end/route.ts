import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const endCallSchema = z.object({
  roomId: z.string(),
  duration: z.number().optional()
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
    const { roomId, duration } = endCallSchema.parse(body)

    // Find the video call
    const videoCall = await db.videoCall.findUnique({
      where: { roomId },
      include: { session: true }
    })

    if (!videoCall) {
      return NextResponse.json(
        { error: 'ไม่พบการโทรวิดีโอ' },
        { status: 404 }
      )
    }

    // Update video call record
    const updatedVideoCall = await db.videoCall.update({
      where: { roomId },
      data: {
        status: 'ENDED',
        endTime: new Date(),
        duration: duration || undefined
      }
    })

    // If linked to a session, update session end time
    if (videoCall.sessionId) {
      await db.session.update({
        where: { id: videoCall.sessionId },
        data: {
          endTime: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      videoCall: updatedVideoCall
    })

  } catch (error) {
    console.error('End video call error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสิ้นสุดการโทร' },
      { status: 500 }
    )
  }
}