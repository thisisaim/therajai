import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentId: z.string(),
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
    const { paymentIntentId, paymentId } = confirmPaymentSchema.parse(body)

    // Get payment record
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            therapist: true,
            client: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการชำระเงิน' },
        { status: 404 }
      )
    }

    // Check if user is the client
    if (payment.clientId !== session.user.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงการชำระเงินนี้' },
        { status: 403 }
      )
    }

    // Retrieve payment intent from Stripe with expanded charges
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges.data']
    })

    if (paymentIntent.status === 'succeeded') {
      // Get receipt URL from the latest charge
      let receiptUrl = null
      const expandedPaymentIntent = paymentIntent as any
      if (expandedPaymentIntent.charges?.data?.length > 0) {
        receiptUrl = expandedPaymentIntent.charges.data[0].receipt_url
      }

      // Update payment status in database
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          stripePaymentId: paymentIntent.latest_charge as string,
          receiptUrl,
        }
      })

      // Update appointment status
      if (payment.appointment) {
        await db.appointment.update({
          where: { id: payment.appointment.id },
          data: {
            status: 'SCHEDULED' // Keep as scheduled until session starts
          }
        })
      }

      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        receiptUrl,
        message: 'การชำระเงินสำเร็จ'
      })
    } else {
      // Payment failed or pending
      let status: 'PENDING' | 'FAILED' = 'PENDING'
      
      if (paymentIntent.status === 'canceled') {
        status = 'FAILED'
      }

      await db.payment.update({
        where: { id: paymentId },
        data: { status }
      })

      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        message: status === 'FAILED' ? 'การชำระเงินไม่สำเร็จ' : 'การชำระเงินอยู่ระหว่างดำเนินการ'
      })
    }

  } catch (error) {
    console.error('Confirm payment error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน' },
      { status: 500 }
    )
  }
}