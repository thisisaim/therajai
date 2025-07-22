import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    const therapist = await db.user.findUnique({
      where: { 
        id: params.id,
        role: 'THERAPIST'
      },
      include: {
        therapistProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            licenseNumber: true,
            specializations: true,
            experience: true,
            education: true,
            languages: true,
            bio: true,
            hourlyRate: true,
            verified: true,
            rating: true,
            totalSessions: true,
            availableOnline: true,
            availableInPerson: true,
            address: true
          }
        }
      }
    })

    if (!therapist || !therapist.therapistProfile) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนักจิตวิทยา' },
        { status: 404 }
      )
    }

    // Only show verified therapists to clients
    if (session.user.role === 'CLIENT' && !therapist.therapistProfile.verified) {
      return NextResponse.json(
        { error: 'นักจิตวิทยาท่านนี้ยังไม่ได้รับการยืนยัน' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      therapist
    })

  } catch (error) {
    console.error('Get therapist error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักจิตวิทยา' },
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

    // Only therapists can update their own profile or admins can update any
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      title,
      specializations,
      experience,
      education,
      languages,
      bio,
      hourlyRate,
      availableOnline,
      availableInPerson,
      address
    } = body

    // Update therapist profile
    const updatedProfile = await db.therapistProfile.update({
      where: { userId: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(title && { title }),
        ...(specializations && { specializations }),
        ...(experience && { experience: parseInt(experience) }),
        ...(education && { education }),
        ...(languages && { languages }),
        ...(bio && { bio }),
        ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
        ...(typeof availableOnline === 'boolean' && { availableOnline }),
        ...(typeof availableInPerson === 'boolean' && { availableInPerson }),
        ...(address && { address })
      }
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'อัพเดทโปรไฟล์สำเร็จ'
    })

  } catch (error) {
    console.error('Update therapist profile error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์' },
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

    // Only admins can delete therapist profiles
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'เฉพาะแอดมินเท่านั้นที่สามารถลบโปรไฟล์ได้' },
        { status: 403 }
      )
    }

    // Check if therapist has active appointments
    const activeAppointments = await db.appointment.count({
      where: {
        therapistId: params.id,
        status: 'SCHEDULED',
        dateTime: {
          gte: new Date()
        }
      }
    })

    if (activeAppointments > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบโปรไฟล์ที่มีการนัดหมายที่ยังไม่เสร็จสิ้น' },
        { status: 400 }
      )
    }

    // Delete therapist profile
    await db.therapistProfile.delete({
      where: { userId: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบโปรไฟล์นักจิตวิทยาสำเร็จ'
    })

  } catch (error) {
    console.error('Delete therapist profile error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบโปรไฟล์' },
      { status: 500 }
    )
  }
}