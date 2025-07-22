import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, notes } = await request.json()
    const therapistId = params.id

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Check if therapist exists
    const therapist = await prisma.therapistProfile.findUnique({
      where: { id: therapistId },
      include: { user: true }
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Update verification status
    const updateData = {
      verified: action === 'approve',
      rejected: action === 'reject',
      verificationNotes: notes || null,
      verifiedAt: action === 'approve' ? new Date() : null,
      verifiedBy: session.user.id
    }

    const updatedTherapist = await prisma.therapistProfile.update({
      where: { id: therapistId },
      data: updateData
    })

    // TODO: Send notification email to therapist
    // This would be implemented with the notification system

    return NextResponse.json({ 
      success: true, 
      action,
      therapist: updatedTherapist 
    })

  } catch (error) {
    console.error('Error processing therapist verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}