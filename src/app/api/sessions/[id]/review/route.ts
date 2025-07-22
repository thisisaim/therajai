import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating, feedback } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'กรุณาให้คะแนน 1-5 ดาว' },
        { status: 400 }
      )
    }

    // Find the session
    const sessionRecord = await db.session.findUnique({
      where: { id: params.id },
      include: {
        appointment: {
          include: {
            client: true,
            therapist: {
              include: {
                therapistProfile: true
              }
            }
          }
        }
      }
    })

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'ไม่พบเซสชันที่ระบุ' },
        { status: 404 }
      )
    }

    // Check if user is the client of this session
    if (sessionRecord.clientId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ให้คะแนนเซสชันนี้' },
        { status: 403 }
      )
    }

    // Check if session is ended
    if (!sessionRecord.endTime) {
      return NextResponse.json(
        { error: 'ไม่สามารถให้คะแนนเซสชันที่ยังไม่จบได้' },
        { status: 400 }
      )
    }

    // Check if already rated
    if (sessionRecord.rating) {
      return NextResponse.json(
        { error: 'คุณได้ให้คะแนนเซสชันนี้แล้ว' },
        { status: 400 }
      )
    }

    // Update session with rating and feedback
    const updatedSession = await db.session.update({
      where: { id: params.id },
      data: {
        rating,
        clientFeedback: feedback || null
      }
    })

    // Update therapist's aggregate rating
    await updateTherapistRating(sessionRecord.therapistId)

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'บันทึกการให้คะแนนสำเร็จ'
    })

  } catch (error) {
    console.error('Submit review error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการให้คะแนน' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get session with review
    const sessionRecord = await db.session.findUnique({
      where: { id: params.id },
      include: {
        appointment: {
          include: {
            client: {
              include: {
                clientProfile: true
              }
            },
            therapist: {
              include: {
                therapistProfile: true
              }
            }
          }
        }
      }
    })

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'ไม่พบเซสชันที่ระบุ' },
        { status: 404 }
      )
    }

    // Check access permissions
    const hasAccess = sessionRecord.clientId === session.user.id || 
                      sessionRecord.therapistId === session.user.id ||
                      session.user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงเซสชันนี้' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      session: sessionRecord
    })

  } catch (error) {
    console.error('Get session review error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเซสชัน' },
      { status: 500 }
    )
  }
}

// Helper function to update therapist's aggregate rating
async function updateTherapistRating(therapistId: string) {
  try {
    // Get all completed sessions with ratings for this therapist
    const sessions = await db.session.findMany({
      where: {
        therapistId,
        rating: {
          not: null
        },
        endTime: {
          not: null
        }
      },
      select: {
        rating: true
      }
    })

    if (sessions.length === 0) {
      return
    }

    // Calculate average rating
    const totalRating = sessions.reduce((sum, session) => sum + (session.rating || 0), 0)
    const averageRating = totalRating / sessions.length
    const roundedRating = Math.round(averageRating * 10) / 10 // Round to 1 decimal place

    // Update therapist profile
    await db.therapistProfile.update({
      where: { userId: therapistId },
      data: {
        rating: roundedRating,
        totalSessions: sessions.length
      }
    })

    console.log(`Updated therapist ${therapistId} rating: ${roundedRating} (${sessions.length} sessions)`)

  } catch (error) {
    console.error('Error updating therapist rating:', error)
  }
}