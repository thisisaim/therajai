import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationScheduler } from '@/lib/notification-scheduler'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการส่งการแจ้งเตือน' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type } = body

    if (type === '24h') {
      // Send 24-hour reminders
      await NotificationScheduler.send24HourReminders()
      
      return NextResponse.json({
        success: true,
        message: 'ส่งการแจ้งเตือน 24 ชั่วโมงสำเร็จ'
      })
      
    } else if (type === '2h') {
      // Send 2-hour reminders
      await NotificationScheduler.send2HourReminders()
      
      return NextResponse.json({
        success: true,
        message: 'ส่งการแจ้งเตือน 2 ชั่วโมงสำเร็จ'
      })
      
    } else {
      return NextResponse.json(
        { error: 'ประเภทการแจ้งเตือนไม่ถูกต้อง' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Schedule notifications error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ในการดูข้อมูลการแจ้งเตือน' },
        { status: 403 }
      )
    }

    const summary = await NotificationScheduler.getNotificationSummary()
    
    return NextResponse.json({
      success: true,
      summary
    })

  } catch (error) {
    console.error('Get notification summary error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการแจ้งเตือน' },
      { status: 500 }
    )
  }
}