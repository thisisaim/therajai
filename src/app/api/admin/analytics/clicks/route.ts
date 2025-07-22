import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const pageUrl = searchParams.get('pageUrl')
    const elementType = searchParams.get('elementType')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build where clause for filtering
    let whereClause: any = {}

    if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (pageUrl) {
      whereClause.pageUrl = {
        contains: pageUrl
      }
    }

    if (elementType) {
      whereClause.elementType = elementType
    }

    if (userId) {
      whereClause.userId = userId
    }

    // Get click events with pagination
    const clickEvents = await db.clickEvent.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await db.clickEvent.count({
      where: whereClause
    })

    // Get aggregated data
    const aggregatedData = await db.clickEvent.groupBy({
      by: ['pageUrl', 'elementType'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get top referrers
    const topReferrers = await db.clickEvent.groupBy({
      by: ['referrer'],
      where: {
        ...whereClause,
        referrer: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Get UTM source data
    const utmSources = await db.clickEvent.groupBy({
      by: ['utmSource'],
      where: {
        ...whereClause,
        utmSource: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: {
        clickEvents,
        aggregatedData,
        topReferrers,
        utmSources,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching click analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}