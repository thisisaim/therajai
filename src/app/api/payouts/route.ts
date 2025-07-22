import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CommissionService } from '@/lib/commission'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลการจ่ายเงิน' },
        { status: 403 }
      )
    }

    const pendingPayouts = await CommissionService.getPendingPayouts()
    
    return NextResponse.json({
      success: true,
      payouts: pendingPayouts
    })

  } catch (error) {
    console.error('Get payouts error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจ่ายเงิน' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์สร้างการจ่ายเงิน' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { therapistId, commissionIds } = body

    if (!therapistId || !commissionIds || !Array.isArray(commissionIds)) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    const payout = await CommissionService.createPayout(therapistId, commissionIds)
    
    return NextResponse.json({
      success: true,
      payout,
      message: 'สร้างการจ่ายเงินสำเร็จ'
    })

  } catch (error) {
    console.error('Create payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างการจ่ายเงิน' },
      { status: 500 }
    )
  }
}