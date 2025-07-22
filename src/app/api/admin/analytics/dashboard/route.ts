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
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total clicks in the period
    const totalClicks = await db.clickEvent.count({
      where: {
        timestamp: {
          gte: startDate
        }
      }
    })

    // Get clicks by day
    const clicksByDay = await db.clickEvent.findMany({
      where: {
        timestamp: {
          gte: startDate
        }
      },
      select: {
        timestamp: true
      }
    })

    // Group clicks by day
    const clicksByDayGrouped = clicksByDay.reduce((acc, click) => {
      const day = click.timestamp.toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get top pages
    const topPages = await db.clickEvent.groupBy({
      by: ['pageUrl'],
      where: {
        timestamp: {
          gte: startDate
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

    // Get top elements
    const topElements = await db.clickEvent.groupBy({
      by: ['elementType'],
      where: {
        timestamp: {
          gte: startDate
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

    // Get unique users and sessions
    const uniqueUsers = await db.clickEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: startDate
        },
        userId: {
          not: null
        }
      },
      _count: {
        id: true
      }
    })

    const uniqueSessions = await db.clickEvent.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    // Get traffic sources
    const trafficSources = await db.clickEvent.groupBy({
      by: ['referrer'],
      where: {
        timestamp: {
          gte: startDate
        },
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

    // Get UTM campaign data
    const utmCampaigns = await db.clickEvent.groupBy({
      by: ['utmCampaign'],
      where: {
        timestamp: {
          gte: startDate
        },
        utmCampaign: {
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
        totalClicks,
        uniqueUsers: uniqueUsers.length,
        uniqueSessions: uniqueSessions.length,
        clicksByDay: clicksByDayGrouped,
        topPages: topPages.map(p => ({
          pageUrl: p.pageUrl,
          clicks: p._count.id
        })),
        topElements: topElements.map(e => ({
          elementType: e.elementType,
          clicks: e._count.id
        })),
        trafficSources: trafficSources.map(s => ({
          referrer: s.referrer,
          clicks: s._count.id
        })),
        utmCampaigns: utmCampaigns.map(c => ({
          campaign: c.utmCampaign,
          clicks: c._count.id
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}