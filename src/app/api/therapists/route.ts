import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const specialization = searchParams.get('specialization')
    const sessionType = searchParams.get('sessionType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // Build where clause for filtering
    const whereClause: any = {
      role: 'THERAPIST',
      therapistProfile: {
        verified: true // Only show verified therapists
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { therapistProfile: { bio: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Add specialization filter
    if (specialization) {
      whereClause.therapistProfile.specializations = {
        has: specialization
      }
    }

    // Add session type filter
    if (sessionType === 'online') {
      whereClause.therapistProfile.availableOnline = true
    } else if (sessionType === 'in-person') {
      whereClause.therapistProfile.availableInPerson = true
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      const priceFilter: any = {}
      if (minPrice) priceFilter.gte = parseFloat(minPrice)
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice)
      whereClause.therapistProfile.hourlyRate = priceFilter
    }

    const therapists = await db.user.findMany({
      where: whereClause,
      include: {
        therapistProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            specializations: true,
            experience: true,
            hourlyRate: true,
            bio: true,
            verified: true,
            rating: true,
            totalSessions: true,
            availableOnline: true,
            availableInPerson: true,
            address: true
          }
        }
      },
      orderBy: [
        { therapistProfile: { verified: 'desc' } }, // Verified first
        { therapistProfile: { rating: 'desc' } },   // Then by rating
        { therapistProfile: { totalSessions: 'desc' } } // Then by experience
      ]
    })

    // Filter out therapists without profiles
    const validTherapists = therapists.filter(therapist => therapist.therapistProfile)

    return NextResponse.json({
      success: true,
      therapists: validTherapists,
      count: validTherapists.length
    })

  } catch (error) {
    console.error('Get therapists error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักจิตวิทยา' },
      { status: 500 }
    )
  }
}

// Create a new therapist profile (for therapist registration)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // Only therapists can create therapist profiles
    if (session.user.role !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'เฉพาะนักจิตวิทยาเท่านั้นที่สามารถสร้างโปรไฟล์ได้' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      title,
      licenseNumber,
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

    // Check if profile already exists
    const existingProfile = await db.therapistProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'โปรไฟล์นักจิตวิทยามีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Check if license number is unique
    const existingLicense = await db.therapistProfile.findUnique({
      where: { licenseNumber }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'หมายเลขใบอนุญาตนี้ถูกใช้แล้ว' },
        { status: 400 }
      )
    }

    // Create therapist profile
    const therapistProfile = await db.therapistProfile.create({
      data: {
        userId: session.user.id,
        firstName,
        lastName,
        title,
        licenseNumber,
        specializations,
        experience: parseInt(experience),
        education,
        languages,
        bio,
        hourlyRate: parseFloat(hourlyRate),
        availableOnline: availableOnline ?? true,
        availableInPerson: availableInPerson ?? false,
        address,
        verified: false, // Requires admin verification
        rating: 0,
        totalSessions: 0
      }
    })

    return NextResponse.json({
      success: true,
      profile: therapistProfile,
      message: 'สร้างโปรไฟล์นักจิตวิทยาสำเร็จ รอการยืนยันจากแอดมิน'
    })

  } catch (error) {
    console.error('Create therapist profile error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างโปรไฟล์' },
      { status: 500 }
    )
  }
}