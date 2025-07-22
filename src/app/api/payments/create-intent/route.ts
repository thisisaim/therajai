import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPaymentIntent, calculateProcessingFee, calculateNetAmount, ThaiPaymentMethod } from '@/lib/stripe'
import { z } from 'zod'

const createIntentSchema = z.object({
  appointmentId: z.string(),
  paymentMethod: z.enum(['card', 'promptpay', 'alipay', 'grab_pay']).default('card'),
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
    const { appointmentId, paymentMethod } = createIntentSchema.parse(body)

    // Get appointment details
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        therapist: {
          include: {
            therapistProfile: true
          }
        },
        client: true,
        payment: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'ไม่พบการนัดหมาย' },
        { status: 404 }
      )
    }

    // Check if user is the client
    if (appointment.clientId !== session.user.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงการนัดหมายนี้' },
        { status: 403 }
      )
    }

    // Check if payment already exists
    if (appointment.payment) {
      return NextResponse.json(
        { error: 'การชำระเงินสำหรับการนัดหมายนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Get therapist hourly rate
    const hourlyRate = appointment.therapist.therapistProfile?.hourlyRate
    if (!hourlyRate) {
      return NextResponse.json(
        { error: 'ไม่พบอัตราค่าบริการของนักจิตวิทยา' },
        { status: 400 }
      )
    }

    // Calculate total amount based on appointment duration
    const duration = appointment.duration || 60 // default 60 minutes
    const amount = Number(hourlyRate) * (duration / 60)
    
    const processingFee = calculateProcessingFee(amount, paymentMethod as ThaiPaymentMethod)
    const netAmount = calculateNetAmount(amount, paymentMethod as ThaiPaymentMethod)

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      paymentMethod: paymentMethod as ThaiPaymentMethod,
      description: `การปรึกษาจิตวิทยากับ ${appointment.therapist.name}`,
      metadata: {
        appointmentId,
        clientId: session.user.id,
        therapistId: appointment.therapistId,
        duration: duration.toString(),
      }
    })

    // Create payment record in database
    const payment = await db.payment.create({
      data: {
        appointmentId,
        clientId: session.user.id,
        amount,
        currency: 'THB',
        status: 'PENDING',
        paymentMethod: paymentMethod.toUpperCase() as any,
        stripeIntentId: paymentIntent.id,
        description: `การปรึกษาจิตวิทยากับ ${appointment.therapist.name} (${duration} นาที)`,
        processingFee,
        netAmount,
      }
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount,
      processingFee,
      netAmount,
      currency: 'THB',
      description: payment.description,
    })

  } catch (error) {
    console.error('Create payment intent error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน' },
      { status: 500 }
    )
  }
}