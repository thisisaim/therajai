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
    const { reason, refundRequested } = body

    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true
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
                title: true
              }
            }
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

    // Check permissions - only client, therapist, or admin can cancel
    const canCancel = appointment.clientId === session.user.id || 
                      appointment.therapistId === session.user.id ||
                      session.user.role === 'ADMIN'

    if (!canCancel) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ยกเลิกการนัดหมายนี้' },
        { status: 403 }
      )
    }

    // Check if appointment can be cancelled
    if (appointment.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกการนัดหมายที่ไม่ใช่สถานะกำหนดการได้' },
        { status: 400 }
      )
    }

    // Check cancellation policy (24 hours before appointment)
    const appointmentTime = new Date(appointment.dateTime)
    const now = new Date()
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Determine refund eligibility based on cancellation policy
    let refundEligible = false
    let refundAmount = 0
    let cancellationFee = 0

    if (appointment.payment?.status === 'COMPLETED') {
      const totalAmount = Number(appointment.payment.amount)
      
      if (hoursUntilAppointment >= 24) {
        // Full refund if cancelled 24+ hours in advance
        refundEligible = true
        refundAmount = totalAmount
        cancellationFee = 0
      } else if (hoursUntilAppointment >= 2) {
        // 50% refund if cancelled 2-24 hours in advance
        refundEligible = true
        refundAmount = totalAmount * 0.5
        cancellationFee = totalAmount * 0.5
      } else {
        // No refund if cancelled less than 2 hours in advance
        refundEligible = false
        refundAmount = 0
        cancellationFee = totalAmount
      }
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Update appointment status
      const cancelledAppointment = await tx.appointment.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          notes: appointment.notes ? 
            `${appointment.notes}\n\nยกเลิกเมื่อ: ${now.toLocaleString('th-TH')}\nเหตุผล: ${reason || 'ไม่ระบุ'}` :
            `ยกเลิกเมื่อ: ${now.toLocaleString('th-TH')}\nเหตุผล: ${reason || 'ไม่ระบุ'}`
        }
      })

      // Handle refund if eligible and requested
      if (refundEligible && refundRequested && appointment.payment) {
        await tx.payment.update({
          where: { id: appointment.payment.id },
          data: {
            status: 'REFUNDED',
            refundedAmount: refundAmount,
            description: appointment.payment.description + 
              ` (ยกเลิกและคืนเงิน ${refundAmount.toLocaleString()} บาท, ค่าธรรมเนียม ${cancellationFee.toLocaleString()} บาท)`
          }
        })
      }

      return {
        appointment: cancelledAppointment,
        refundInfo: {
          eligible: refundEligible,
          amount: refundAmount,
          fee: cancellationFee,
          processed: refundEligible && refundRequested
        }
      }
    })

    // Prepare response message
    let message = 'ยกเลิกการนัดหมายสำเร็จ'
    if (result.refundInfo.eligible) {
      if (refundRequested) {
        message += ` คืนเงินจำนวน ฿${result.refundInfo.amount.toLocaleString()}`
        if (result.refundInfo.fee > 0) {
          message += ` (หักค่าธรรมเนียม ฿${result.refundInfo.fee.toLocaleString()})`
        }
      } else {
        message += ` มีสิทธิ์คืนเงิน ฿${result.refundInfo.amount.toLocaleString()}`
      }
    } else if (appointment.payment?.status === 'COMPLETED') {
      message += ' ไม่มีสิทธิ์คืนเงินเนื่องจากยกเลิกใกล้เวลานัดหมาย'
    }

    return NextResponse.json({
      success: true,
      message,
      appointment: result.appointment,
      refundInfo: result.refundInfo,
      policy: {
        fullRefund: '24 ชั่วโมงขึ้นไป',
        partialRefund: '2-24 ชั่วโมง (คืน 50%)',
        noRefund: 'น้อยกว่า 2 ชั่วโมง'
      }
    })

  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิกการนัดหมาย' },
      { status: 500 }
    )
  }
}