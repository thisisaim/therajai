import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CommissionService } from '@/lib/commission'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Only therapists can view their own commissions, admins can view all
    if (session.user.role === 'THERAPIST') {
      if (!therapistId || therapistId !== session.user.id) {
        return NextResponse.json(
          { error: 'คุณสามารถดูคอมมิชชั่นของตัวเองเท่านั้น' },
          { status: 403 }
        )
      }
    } else if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลคอมมิชชั่น' },
        { status: 403 }
      )
    }

    if (therapistId) {
      // Get specific therapist's commissions
      const [summary, commissions] = await Promise.all([
        CommissionService.getTherapistCommissionSummary(therapistId),
        CommissionService.getTherapistCommissions(therapistId, limit, offset)
      ])

      return NextResponse.json({
        success: true,
        summary,
        commissions
      })
    } else {
      // Admin: Get all pending payouts
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' },
          { status: 403 }
        )
      }

      const pendingPayouts = await CommissionService.getPendingPayouts()
      return NextResponse.json({
        success: true,
        pendingPayouts
      })
    }

  } catch (error) {
    console.error('Get commissions error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคอมมิशชั่น' },
      { status: 500 }
    )
  }
}