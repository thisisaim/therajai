import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'THERAPIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json(therapistProfile)
  } catch (error) {
    console.error('Error fetching therapist profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'THERAPIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      firstName,
      lastName,
      title,
      phone,
      dateOfBirth,
      licenseNumber,
      experience,
      education,
      specializations,
      languages,
      bio,
      hourlyRate,
      availableOnline,
      availableInPerson,
      address
    } = body

    // Validation
    if (!firstName || !lastName || !licenseNumber || !experience || !education || !specializations?.length || !languages?.length || !bio || !hourlyRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate numeric fields
    const experienceNum = parseInt(experience)
    const hourlyRateNum = parseFloat(hourlyRate)
    
    if (isNaN(experienceNum) || experienceNum < 0) {
      return NextResponse.json({ error: 'Experience must be a valid non-negative number' }, { status: 400 })
    }
    
    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      return NextResponse.json({ error: 'Hourly rate must be a valid positive number' }, { status: 400 })
    }

    if (!availableOnline && !availableInPerson) {
      return NextResponse.json({ error: 'Must select at least one service type' }, { status: 400 })
    }

    // Check if profile already exists
    const existingProfile = await prisma.therapistProfile.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists. Use PUT to update.' }, { status: 409 })
    }

    // Create therapist profile
    const therapistProfile = await prisma.therapistProfile.create({
      data: {
        userId: session.user.id,
        firstName,
        lastName,
        title: title || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        licenseNumber,
        experience: experienceNum,
        education,
        specializations,
        languages: languages || [],
        bio,
        hourlyRate: hourlyRateNum,
        availableOnline,
        availableInPerson,
        address: availableInPerson ? address : null,
        verified: false, // Will be verified by admin
        rating: 0,
        totalSessions: 0,
      }
    })

    return NextResponse.json(therapistProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating therapist profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'THERAPIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      firstName,
      lastName,
      title,
      phone,
      dateOfBirth,
      licenseNumber,
      experience,
      education,
      specializations,
      languages,
      bio,
      hourlyRate,
      availableOnline,
      availableInPerson,
      address
    } = body

    // Validation
    if (!firstName || !lastName || !licenseNumber || !experience || !education || !specializations?.length || !languages?.length || !bio || !hourlyRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate numeric fields
    const experienceNum = parseInt(experience)
    const hourlyRateNum = parseFloat(hourlyRate)
    
    if (isNaN(experienceNum) || experienceNum < 0) {
      return NextResponse.json({ error: 'Experience must be a valid non-negative number' }, { status: 400 })
    }
    
    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      return NextResponse.json({ error: 'Hourly rate must be a valid positive number' }, { status: 400 })
    }

    if (!availableOnline && !availableInPerson) {
      return NextResponse.json({ error: 'Must select at least one service type' }, { status: 400 })
    }

    // Update therapist profile
    const therapistProfile = await prisma.therapistProfile.update({
      where: {
        userId: session.user.id
      },
      data: {
        firstName,
        lastName,
        title: title || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        licenseNumber,
        experience: experienceNum,
        education,
        specializations,
        languages: languages || [],
        bio,
        hourlyRate: hourlyRateNum,
        availableOnline,
        availableInPerson,
        address: availableInPerson ? address : null,
      }
    })

    return NextResponse.json(therapistProfile)
  } catch (error) {
    console.error('Error updating therapist profile:', error)
    
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}