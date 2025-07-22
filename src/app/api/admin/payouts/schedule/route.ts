import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PayoutScheduler } from '@/lib/payout-scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการสร้างการจ่ายเงินอัตโนมัติ' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, therapistId } = body

    if (type === 'weekly') {
      // Create weekly payouts for all eligible therapists
      await PayoutScheduler.createWeeklyPayouts()
      
      return NextResponse.json({
        success: true,
        message: 'สร้างการจ่ายเงินรายสัปดาห์สำเร็จ'
      })
      
    } else if (type === 'individual' && therapistId) {
      // Create payout for specific therapist
      const created = await PayoutScheduler.createPayoutForTherapist(therapistId)
      
      if (created) {
        return NextResponse.json({
          success: true,
          message: 'สร้างการจ่ายเงินสำหรับนักจิตวิทยาสำเร็จ'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'ไม่สามารถสร้างการจ่ายเงินได้ (จำนวนเงินต่ำกว่าขั้นต่ำ หรือไม่มีคอมมิชชั่นที่รอจ่าย)'
        })
      }
      
    } else {
      return NextResponse.json(
        { error: 'ประเภทการสร้างการจ่ายเงินไม่ถูกต้อง' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Schedule payouts error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการจ่ายเงิน' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการดูข้อมูลการจ่ายเงิน' },
        { status: 403 }
      )
    }

    const summary = await PayoutScheduler.getPayoutScheduleSummary()
    
    return NextResponse.json({
      success: true,
      summary
    })

  } catch (error) {
    console.error('Get payout schedule summary error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการจ่ายเงิน' },
      { status: 500 }
    )
  }
}