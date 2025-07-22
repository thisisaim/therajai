import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapists = await prisma.therapistProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { verified: 'asc' }, // Show unverified first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(therapists)
  } catch (error) {
    console.error('Error fetching therapists for admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}