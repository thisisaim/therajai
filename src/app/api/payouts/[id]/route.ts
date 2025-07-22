import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CommissionService } from '@/lib/commission'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขการจ่ายเงิน' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { stripeTransferId } = body

    const payout = await CommissionService.processPayout(params.id, stripeTransferId)
    
    return NextResponse.json({
      success: true,
      payout,
      message: 'ประมวลผลการจ่ายเงินสำเร็จ'
    })

  } catch (error) {
    console.error('Process payout error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผลการจ่ายเงิน' },
      { status: 500 }
    )
  }
}