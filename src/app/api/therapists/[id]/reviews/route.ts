import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get reviews for this therapist (only completed sessions with ratings)
    const reviews = await db.session.findMany({
      where: {
        therapistId: params.id,
        rating: {
          not: null
        },
        endTime: {
          not: null
        },
        clientFeedback: {
          not: null
        }
      },
      include: {
        appointment: {
          include: {
            client: {
              include: {
                clientProfile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        endTime: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalReviews = await db.session.count({
      where: {
        therapistId: params.id,
        rating: {
          not: null
        },
        endTime: {
          not: null
        },
        clientFeedback: {
          not: null
        }
      }
    })

    // Get rating distribution
    const ratingDistribution = await db.session.groupBy({
      by: ['rating'],
      where: {
        therapistId: params.id,
        rating: {
          not: null
        },
        endTime: {
          not: null
        }
      },
      _count: {
        rating: true
      }
    })

    // Transform data for frontend
    const transformedReviews = reviews.map(session => ({
      id: session.id,
      rating: session.rating,
      feedback: session.clientFeedback,
      clientName: session.appointment.client.clientProfile?.firstName 
        ? `${session.appointment.client.clientProfile.firstName} ${session.appointment.client.clientProfile.lastName.charAt(0)}.`
        : `${session.appointment.client.name.split(' ')[0]} ${session.appointment.client.name.split(' ').slice(1).join(' ').charAt(0)}.`,
      sessionDate: session.appointment.dateTime,
      submittedAt: session.endTime
    }))

    // Create rating distribution object
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratingDistribution.forEach(item => {
      if (item.rating) {
        distribution[item.rating as keyof typeof distribution] = item._count.rating
      }
    })

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      pagination: {
        total: totalReviews,
        limit,
        offset,
        hasMore: offset + limit < totalReviews
      },
      statistics: {
        totalReviews,
        ratingDistribution: distribution
      }
    })

  } catch (error) {
    console.error('Get therapist reviews error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' },
      { status: 500 }
    )
  }
}