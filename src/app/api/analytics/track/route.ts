import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sessionId, 
      elementType, 
      elementId, 
      elementClass, 
      elementText,
      pageUrl,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent
    } = body

    // Validate required fields
    if (!sessionId || !elementType || !pageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user session if available (optional for tracking)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Get IP address and user agent
    const userAgent = request.headers.get('user-agent') || null
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.ip
    
    // Hash IP address for privacy
    const hashedIp = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null

    // Rate limiting check: max 1000 clicks per session per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentClicks = await db.clickEvent.count({
      where: {
        sessionId,
        timestamp: {
          gte: oneHourAgo
        }
      }
    })

    if (recentClicks > 1000) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Create click event
    const clickEvent = await db.clickEvent.create({
      data: {
        sessionId,
        userId,
        elementType,
        elementId,
        elementClass,
        elementText: elementText?.substring(0, 500), // Limit text length
        pageUrl,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        userAgent,
        ipAddress: hashedIp,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      id: clickEvent.id
    })

  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}