import { NextRequest, NextResponse } from 'next/server'
import { calculateProcessingFee, ThaiPaymentMethod } from '@/lib/stripe'
import { z } from 'zod'

const calculateFeesSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['card', 'promptpay', 'alipay', 'grab_pay']).default('card'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, paymentMethod } = calculateFeesSchema.parse(body)

    const processingFee = calculateProcessingFee(amount, paymentMethod as ThaiPaymentMethod)
    const totalAmount = amount + processingFee

    return NextResponse.json({
      success: true,
      amount,
      processingFee,
      totalAmount,
      paymentMethod,
    })

  } catch (error) {
    console.error('Calculate fees error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการคำนวณค่าธรรมเนียม' },
      { status: 500 }
    )
  }
}