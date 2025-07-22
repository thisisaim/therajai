import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommissionService } from '@/lib/commission'

interface RouteParams {
  params: {
    id: string
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

    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
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
            email: true
          },
          include: {
            therapistProfile: {
              select: {
                firstName: true,
                lastName: true,
                hourlyRate: true,
                title: true
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
            createdAt: true,
            receiptUrl: true
          }
        },
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            sessionNotes: true,
            rating: true
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

    // Check if user has access to this appointment
    const hasAccess = appointment.clientId === session.user.id || 
                      appointment.therapistId === session.user.id ||
                      session.user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงการนัดหมายนี้' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    })

  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, notes, sessionNotes } = body

    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: { session: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'ไม่พบการนัดหมาย' },
        { status: 404 }
      )
    }

    // Check if user has permission to update
    const canUpdate = appointment.clientId === session.user.id || 
                      appointment.therapistId === session.user.id ||
                      session.user.role === 'ADMIN'

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขการนัดหมายนี้' },
        { status: 403 }
      )
    }

    // Use transaction to update both appointment and session
    const result = await db.$transaction(async (tx) => {
      // Update appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id: params.id },
        data: {
          ...(status && { status }),
          ...(notes && { notes })
        },
      })

      // Handle session notes (for therapists)
      if (sessionNotes !== undefined && session.user.role === 'THERAPIST') {
        if (appointment.session) {
          // Update existing session
          await tx.session.update({
            where: { id: appointment.session.id },
            data: { sessionNotes }
          })
        } else {
          // Create new session
          await tx.session.create({
            data: {
              appointmentId: params.id,
              clientId: appointment.clientId,
              therapistId: appointment.therapistId,
              startTime: new Date(appointment.dateTime),
              sessionNotes
            }
          })
        }
      }

      return updatedAppointment
    })

    // Create commission if appointment is completed and has a session
    if (status === 'COMPLETED' && appointment.session) {
      try {
        await CommissionService.createCommission(appointment.session.id)
      } catch (error) {
        console.error('Failed to create commission:', error)
        // Don't fail the appointment update if commission creation fails
      }
    }

    // Fetch the complete updated appointment with relations
    const updatedAppointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
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
            email: true
          },
          include: {
            therapistProfile: {
              select: {
                firstName: true,
                lastName: true,
                hourlyRate: true,
                title: true
              }
            }
          }
        },
        payment: true,
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            sessionNotes: true,
            rating: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment
    })

  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทการนัดหมาย' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: { payment: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'ไม่พบการนัดหมาย' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete
    const canDelete = appointment.clientId === session.user.id || 
                      session.user.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบการนัดหมายนี้' },
        { status: 403 }
      )
    }

    // Check if payment has been made
    if (appointment.payment?.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกการนัดหมายที่ชำระเงินแล้ว' },
        { status: 400 }
      )
    }

    // Cancel the appointment instead of deleting
    const cancelledAppointment = await db.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      message: 'ยกเลิกการนัดหมายสำเร็จ',
      appointment: cancelledAppointment
    })

  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิกการนัดหมาย' },
      { status: 500 }
    )
  }
}