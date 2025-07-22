import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { NotificationScheduler } from '@/lib/notification-scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Only clients can create appointments
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'เฉพาะลูกค้าเท่านั้นที่สามารถจองการปรึกษาได้' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { therapistId, dateTime, duration, type, notes } = body

    // Validate required fields
    if (!therapistId || !dateTime || !duration || !type) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate therapist exists and is verified
    const therapist = await db.user.findUnique({
      where: { id: therapistId },
      include: {
        therapistProfile: true
      }
    })

    if (!therapist || therapist.role !== 'THERAPIST' || !therapist.therapistProfile?.verified) {
      return NextResponse.json(
        { error: 'ไม่พบนักจิตวิทยาที่ระบุ' },
        { status: 404 }
      )
    }

    // Parse and validate date/time
    const appointmentDate = new Date(dateTime)
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'วันที่และเวลาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Check if appointment is in the future
    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { error: 'ไม่สามารถจองย้อนหลังได้' },
        { status: 400 }
      )
    }

    // Validate duration
    if (![60, 90, 120].includes(duration)) {
      return NextResponse.json(
        { error: 'ระยะเวลาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate session type
    if (!['ONLINE', 'IN_PERSON'].includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: 'ประเภทการปรึกษาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Calculate end time
    const endTime = new Date(appointmentDate)
    endTime.setMinutes(endTime.getMinutes() + duration)

    // Check for conflicting appointments
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        therapistId,
        status: {
          in: ['SCHEDULED']
        },
        dateTime: {
          gte: appointmentDate,
          lt: endTime
        }
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น' },
        { status: 409 }
      )
    }

    // Calculate amount (hourly rate * duration in hours)
    const hourlyRate = Number(therapist.therapistProfile.hourlyRate)
    const hours = duration / 60
    const amount = Math.round(hourlyRate * hours * 100) // Amount in satang for Stripe

    // Create appointment
    const appointmentId = nanoid()
    const appointment = await db.appointment.create({
      data: {
        id: appointmentId,
        clientId: session.user.id,
        therapistId,
        dateTime: appointmentDate,
        endTime,
        duration,
        type: type.toUpperCase(),
        notes: notes || null,
        status: 'SCHEDULED',
        amount: amount / 100, // Store in baht
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
            therapistProfile: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
                hourlyRate: true
              }
            }
          }
        }
      }
    })

    // Send notification to therapist about new appointment
    try {
      await NotificationScheduler.sendNewAppointmentNotification(appointmentId)
    } catch (error) {
      console.error('Failed to send new appointment notification:', error)
      // Don't fail the appointment creation if notification fails
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'สร้างการนัดหมายสำเร็จ'
    })

  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการนัดหมาย' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const therapistId = searchParams.get('therapistId')
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause based on user role and filters
    let whereClause: any = {}

    if (session.user.role === 'CLIENT') {
      whereClause.clientId = session.user.id
    } else if (session.user.role === 'THERAPIST') {
      whereClause.therapistId = session.user.id
    } else if (session.user.role === 'ADMIN') {
      // Admin can see all appointments with optional filters
      if (therapistId) whereClause.therapistId = therapistId
      if (clientId) whereClause.clientId = clientId
    } else {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientProfile: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
            therapistProfile: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
                hourlyRate: true
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true
          }
        },
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            rating: true
          }
        }
      },
      orderBy: {
        dateTime: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await db.appointment.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย' },
      { status: 500 }
    )
  }
}