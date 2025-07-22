import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถตั้งค่าตารางเวลาได้' },
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
    const { weeklySchedule, replaceAll } = body

    if (!Array.isArray(weeklySchedule)) {
      return NextResponse.json(
        { error: 'รูปแบบตารางเวลาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate all slots before creating
    const validatedSlots: Array<{
      therapistId: string
      dayOfWeek: number
      startTime: string
      endTime: string
      isAvailable: boolean
    }> = []
    for (const slot of weeklySchedule) {
      const { dayOfWeek, startTime, endTime, isAvailable } = slot

      // Validate required fields
      if (dayOfWeek === undefined || !startTime || !endTime) {
        return NextResponse.json(
          { error: 'กรุณากรอกข้อมูลให้ครบถ้วนในทุกช่วงเวลา' },
          { status: 400 }
        )
      }

      // Validate day of week
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'วันในสัปดาห์ไม่ถูกต้อง (0-6)' },
          { status: 400 }
        )
      }

      // Validate time format
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

      validatedSlots.push({
        therapistId: therapistProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable: isAvailable !== false
      })
    }

    // Check for overlapping slots within the new schedule
    for (let i = 0; i < validatedSlots.length; i++) {
      for (let j = i + 1; j < validatedSlots.length; j++) {
        const slot1 = validatedSlots[i]
        const slot2 = validatedSlots[j]

        if (slot1.dayOfWeek === slot2.dayOfWeek) {
          const start1 = new Date(`2024-01-01T${slot1.startTime}:00`)
          const end1 = new Date(`2024-01-01T${slot1.endTime}:00`)
          const start2 = new Date(`2024-01-01T${slot2.startTime}:00`)
          const end2 = new Date(`2024-01-01T${slot2.endTime}:00`)

          if ((start1 < end2 && end1 > start2)) {
            return NextResponse.json(
              { error: 'พบช่วงเวลาที่ซ้อนทับกันในตารางที่ส่งมา' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // If replaceAll is true, delete existing availability
      if (replaceAll) {
        await tx.therapistAvailability.deleteMany({
          where: { therapistId: therapistProfile.id }
        })
      }

      // Create new availability slots
      const createdSlots = []
      for (const slot of validatedSlots) {
        // Check for existing overlapping slots if not replacing all
        if (!replaceAll) {
          const overlapping = await tx.therapistAvailability.findFirst({
            where: {
              therapistId: therapistProfile.id,
              dayOfWeek: slot.dayOfWeek,
              OR: [
                {
                  startTime: { lte: slot.startTime },
                  endTime: { gt: slot.startTime }
                },
                {
                  startTime: { lt: slot.endTime },
                  endTime: { gte: slot.endTime }
                },
                {
                  startTime: { gte: slot.startTime },
                  endTime: { lte: slot.endTime }
                }
              ]
            }
          })

          if (overlapping) {
            throw new Error(`ช่วงเวลา ${slot.startTime}-${slot.endTime} ในวันที่ ${slot.dayOfWeek} มีการตั้งค่าไว้แล้ว`)
          }
        }

        const created = await tx.therapistAvailability.create({
          data: slot
        })
        createdSlots.push(created)
      }

      return createdSlots
    })

    return NextResponse.json({
      success: true,
      availability: result,
      message: replaceAll ? 'ตั้งค่าตารางเวลาใหม่สำเร็จ' : 'เพิ่มตารางเวลาสำเร็จ'
    })

  } catch (error) {
    console.error('Bulk availability error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตั้งค่าตารางเวลา' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถล้างตารางเวลาได้' },
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

    // Check if there are any future appointments
    const now = new Date()
    const futureAppointments = await db.appointment.count({
      where: {
        therapistId: session.user.id,
        status: 'SCHEDULED',
        dateTime: { gte: now }
      }
    })

    if (futureAppointments > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถล้างตารางเวลาที่มีการนัดหมายในอนาคต' },
        { status: 400 }
      )
    }

    await db.therapistAvailability.deleteMany({
      where: { therapistId: therapistProfile.id }
    })

    return NextResponse.json({
      success: true,
      message: 'ล้างตารางเวลาสำเร็จ'
    })

  } catch (error) {
    console.error('Clear availability error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการล้างตารางเวลา' },
      { status: 500 }
    )
  }
}