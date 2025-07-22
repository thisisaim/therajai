import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const therapistId = searchParams.get('therapistId')

    // Determine which therapist's availability to fetch
    let targetTherapistId: string

    if (session.user.role === 'THERAPIST') {
      // Therapists can only view their own availability
      const therapistProfile = await db.therapistProfile.findUnique({
        where: { userId: session.user.id }
      })
      
      if (!therapistProfile) {
        return NextResponse.json(
          { error: 'ไม่พบโปรไฟล์นักจิตวิทยา' },
          { status: 404 }
        )
      }
      
      targetTherapistId = therapistProfile.id
    } else if (session.user.role === 'CLIENT' || session.user.role === 'ADMIN') {
      // Clients and admins can view specific therapist availability
      if (!therapistId) {
        return NextResponse.json(
          { error: 'กรุณาระบุ therapistId' },
          { status: 400 }
        )
      }
      targetTherapistId = therapistId
    } else {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const availability = await db.therapistAvailability.findMany({
      where: { therapistId: targetTherapistId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      availability
    })

  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเวลาว่าง' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถตั้งเวลาว่างได้' },
        { status: 403 }
      )
    }

    const therapistProfile = await db.therapistProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!therapistProfile) {
      return NextResponse.json(
        { error: 'ไม่พบโปรไฟล์นักจิตวิทยา' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, isAvailable } = body

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate day of week (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'วันในสัปดาห์ไม่ถูกต้อง (0-6)' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'รูปแบบเวลาไม่ถูกต้อง (HH:MM)' },
        { status: 400 }
      )
    }

    // Validate start time is before end time
    const start = new Date(`2024-01-01T${startTime}:00`)
    const end = new Date(`2024-01-01T${endTime}:00`)
    if (start >= end) {
      return NextResponse.json(
        { error: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' },
        { status: 400 }
      )
    }

    // Check for overlapping availability slots
    const overlapping = await db.therapistAvailability.findFirst({
      where: {
        therapistId: therapistProfile.id,
        dayOfWeek,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'ช่วงเวลานี้มีการตั้งค่าไว้แล้ว' },
        { status: 409 }
      )
    }

    const availability = await db.therapistAvailability.create({
      data: {
        therapistId: therapistProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable !== false // Default to true
      }
    })

    return NextResponse.json({
      success: true,
      availability,
      message: 'เพิ่มเวลาว่างสำเร็จ'
    })

  } catch (error) {
    console.error('Create availability error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มเวลาว่าง' },
      { status: 500 }
    )
  }
}