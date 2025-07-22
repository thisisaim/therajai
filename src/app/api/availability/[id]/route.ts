import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถแก้ไขเวลาว่างได้' },
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

    const availabilitySlot = await db.therapistAvailability.findUnique({
      where: { id: params.id }
    })

    if (!availabilitySlot || availabilitySlot.therapistId !== therapistProfile.id) {
      return NextResponse.json(
        { error: 'ไม่พบช่วงเวลาที่ระบุ' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, isAvailable } = body

    const updateData: any = {}

    if (dayOfWeek !== undefined) {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'วันในสัปดาห์ไม่ถูกต้อง (0-6)' },
          { status: 400 }
        )
      }
      updateData.dayOfWeek = dayOfWeek
    }

    if (startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(startTime)) {
        return NextResponse.json(
          { error: 'รูปแบบเวลาเริ่มต้นไม่ถูกต้อง (HH:MM)' },
          { status: 400 }
        )
      }
      updateData.startTime = startTime
    }

    if (endTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(endTime)) {
        return NextResponse.json(
          { error: 'รูปแบบเวลาสิ้นสุดไม่ถูกต้อง (HH:MM)' },
          { status: 400 }
        )
      }
      updateData.endTime = endTime
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable
    }

    // Validate start time is before end time if both are provided
    const finalStartTime = startTime || availabilitySlot.startTime
    const finalEndTime = endTime || availabilitySlot.endTime
    
    const start = new Date(`2024-01-01T${finalStartTime}:00`)
    const end = new Date(`2024-01-01T${finalEndTime}:00`)
    if (start >= end) {
      return NextResponse.json(
        { error: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' },
        { status: 400 }
      )
    }

    // Check for overlapping slots if time or day is being changed
    if (dayOfWeek !== undefined || startTime !== undefined || endTime !== undefined) {
      const finalDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : availabilitySlot.dayOfWeek
      
      const overlapping = await db.therapistAvailability.findFirst({
        where: {
          therapistId: therapistProfile.id,
          dayOfWeek: finalDayOfWeek,
          id: { not: params.id }, // Exclude current slot
          OR: [
            {
              startTime: { lte: finalStartTime },
              endTime: { gt: finalStartTime }
            },
            {
              startTime: { lt: finalEndTime },
              endTime: { gte: finalEndTime }
            },
            {
              startTime: { gte: finalStartTime },
              endTime: { lte: finalEndTime }
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
    }

    const updatedAvailability = await db.therapistAvailability.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      availability: updatedAvailability,
      message: 'อัพเดทเวลาว่างสำเร็จ'
    })

  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทเวลาว่าง' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถลบเวลาว่างได้' },
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

    const availabilitySlot = await db.therapistAvailability.findUnique({
      where: { id: params.id }
    })

    if (!availabilitySlot || availabilitySlot.therapistId !== therapistProfile.id) {
      return NextResponse.json(
        { error: 'ไม่พบช่วงเวลาที่ระบุ' },
        { status: 404 }
      )
    }

    // Check if there are any appointments in this time slot
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
        { error: 'ไม่สามารถลบช่วงเวลาที่มีการนัดหมายในอนาคต' },
        { status: 400 }
      )
    }

    await db.therapistAvailability.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบเวลาว่างสำเร็จ'
    })

  } catch (error) {
    console.error('Delete availability error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบเวลาว่าง' },
      { status: 500 }
    )
  }
}