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
    const { newDateTime, newDuration, reason } = body

    if (!newDateTime) {
      return NextResponse.json(
        { error: 'กรุณาระบุวันเวลาใหม่' },
        { status: 400 }
      )
    }

    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        therapist: {
          include: {
            therapistProfile: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'ไม่พบการนัดหมาย' },
        { status: 404 }
      )
    }

    // Check permissions - only client or therapist can reschedule
    const canReschedule = appointment.clientId === session.user.id || 
                          appointment.therapistId === session.user.id ||
                          session.user.role === 'ADMIN'

    if (!canReschedule) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เปลี่ยนแปลงการนัดหมายนี้' },
        { status: 403 }
      )
    }

    // Check if appointment can be rescheduled
    if (appointment.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนแปลงการนัดหมายที่ไม่ใช่สถานะกำหนดการได้' },
        { status: 400 }
      )
    }

    // Validate new date/time
    const newAppointmentDate = new Date(newDateTime)
    if (isNaN(newAppointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'รูปแบบวันเวลาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Check if new time is in the future
    if (newAppointmentDate <= new Date()) {
      return NextResponse.json(
        { error: 'ไม่สามารถนัดหมายย้อนหลังได้' },
        { status: 400 }
      )
    }

    // Validate duration
    const finalDuration = newDuration || appointment.duration
    if (![60, 90, 120].includes(finalDuration)) {
      return NextResponse.json(
        { error: 'ระยะเวลาไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Calculate new end time
    const newEndTime = new Date(newAppointmentDate)
    newEndTime.setMinutes(newEndTime.getMinutes() + finalDuration)

    // Check for conflicts with therapist's other appointments
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        therapistId: appointment.therapistId,
        id: { not: params.id }, // Exclude current appointment
        status: 'SCHEDULED',
        OR: [
          {
            dateTime: {
              gte: newAppointmentDate,
              lt: newEndTime
            }
          },
          {
            endTime: {
              gt: newAppointmentDate,
              lte: newEndTime
            }
          },
          {
            dateTime: { lte: newAppointmentDate },
            endTime: { gte: newEndTime }
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'ช่วงเวลาใหม่มีการนัดหมายอื่นแล้ว กรุณาเลือกเวลาอื่น' },
        { status: 409 }
      )
    }

    // Check therapist availability for new time
    const dayOfWeek = newAppointmentDate.getDay()
    const timeString = newAppointmentDate.toTimeString().slice(0, 5)
    
    const therapistAvailability = await db.therapistAvailability.findFirst({
      where: {
        therapist: {
          userId: appointment.therapistId
        },
        dayOfWeek,
        isAvailable: true,
        startTime: { lte: timeString },
        endTime: { gte: timeString }
      }
    })

    if (!therapistAvailability) {
      return NextResponse.json(
        { error: 'นักจิตวิทยาไม่ว่างในช่วงเวลาที่เลือก' },
        { status: 400 }
      )
    }

    // Check rescheduling policy
    const originalTime = new Date(appointment.dateTime)
    const now = new Date()
    const hoursUntilOriginal = (originalTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    let rescheduleAllowed = true
    let rescheduleFee = 0

    // Apply rescheduling fees based on timing
    if (hoursUntilOriginal < 24) {
      if (hoursUntilOriginal < 2) {
        rescheduleAllowed = false
      } else {
        // 2-24 hours: 200 baht rescheduling fee
        rescheduleFee = 200
      }
    }
    // 24+ hours: free rescheduling

    if (!rescheduleAllowed) {
      return NextResponse.json(
        { error: 'ไม่สามารถเปลี่ยนแปลงการนัดหมายได้เนื่องจากใกล้เวลานัดหมายมาก (น้อยกว่า 2 ชั่วโมง)' },
        { status: 400 }
      )
    }

    // Calculate new amount if duration changed
    let newAmount = Number(appointment.amount || 0)
    if (newDuration && newDuration !== appointment.duration && appointment.therapist.therapistProfile) {
      const hourlyRate = Number(appointment.therapist.therapistProfile.hourlyRate)
      const hours = finalDuration / 60
      newAmount = hourlyRate * hours + rescheduleFee
    } else if (rescheduleFee > 0) {
      newAmount = Number(appointment.amount || 0) + rescheduleFee
    }

    // Use transaction to update appointment
    const result = await db.$transaction(async (tx) => {
      // Update appointment
      const rescheduledAppointment = await tx.appointment.update({
        where: { id: params.id },
        data: {
          dateTime: newAppointmentDate,
          endTime: newEndTime,
          duration: finalDuration,
          amount: newAmount,
          notes: appointment.notes ? 
            `${appointment.notes}\n\nเปลี่ยนแปลงเมื่อ: ${now.toLocaleString('th-TH')}\nจาก: ${originalTime.toLocaleString('th-TH')}\nเป็น: ${newAppointmentDate.toLocaleString('th-TH')}\nเหตุผล: ${reason || 'ไม่ระบุ'}` :
            `เปลี่ยนแปลงเมื่อ: ${now.toLocaleString('th-TH')}\nจาก: ${originalTime.toLocaleString('th-TH')}\nเป็น: ${newAppointmentDate.toLocaleString('th-TH')}\nเหตุผล: ${reason || 'ไม่ระบุ'}`
        }
      })

      // Update payment if amount changed
      if (appointment.payment && newAmount !== Number(appointment.amount || 0)) {
        await tx.payment.update({
          where: { id: appointment.payment.id },
          data: {
            amount: Number(newAmount),
            description: appointment.payment.description + 
              ` (เปลี่ยนแปลงการนัดหมาย${rescheduleFee > 0 ? `, ค่าธรรมเนียม ฿${rescheduleFee}` : ''})`
          }
        })
      }

      return rescheduledAppointment
    })

    // Prepare response message
    let message = 'เปลี่ยนแปลงการนัดหมายสำเร็จ'
    if (rescheduleFee > 0) {
      message += ` (มีค่าธรรมเนียม ฿${rescheduleFee})`
    }

    return NextResponse.json({
      success: true,
      message,
      appointment: result,
      changes: {
        originalDateTime: originalTime.toISOString(),
        newDateTime: newAppointmentDate.toISOString(),
        originalDuration: appointment.duration,
        newDuration: finalDuration,
        originalAmount: Number(appointment.amount || 0),
        newAmount,
        rescheduleFee
      },
      policy: {
        freeReschedule: '24 ชั่วโมงขึ้นไป',
        feeReschedule: '2-24 ชั่วโมง (ค่าธรรมเนียม ฿200)',
        noReschedule: 'น้อยกว่า 2 ชั่วโมง'
      }
    })

  } catch (error) {
    console.error('Reschedule appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเปลี่ยนแปลงการนัดหมาย' },
      { status: 500 }
    )
  }
}