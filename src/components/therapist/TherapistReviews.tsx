'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, MessageCircle, ThumbsUp, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  feedback: string
  clientName: string
  sessionDate: string
  submittedAt: string
}

interface ReviewsData {
  reviews: Review[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  statistics: {
    totalReviews: number
    ratingDistribution: Record<number, number>
  }
}

interface TherapistReviewsProps {
  therapistId: string
  averageRating: number
  totalSessions: number
}

export default function TherapistReviews({ 
  therapistId, 
  averageRating, 
  totalSessions 
}: TherapistReviewsProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadReviews = async (reset = false) => {
    try {
      const offset = reset ? 0 : reviewsData?.reviews.length || 0
      setLoadingMore(!reset)
      
      const response = await fetch(`/api/therapists/${therapistId}/reviews?limit=5&offset=${offset}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load reviews')
      }

      if (reset || !reviewsData) {
        setReviewsData(data)
      } else {
        setReviewsData({
          ...data,
          reviews: [...reviewsData.reviews, ...data.reviews]
        })
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadReviews(true)
  }, [therapistId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>รีวิวและความคิดเห็น</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-20 h-4 bg-gray-200 rounded" />
                  <div className="w-16 h-4 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!reviewsData || reviewsData.statistics.totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>รีวิวและความคิดเห็น</CardTitle>
          <CardDescription>
            คะแนนเฉลี่ย {averageRating.toFixed(1)} จาก {totalSessions} การปรึกษา
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มีรีวิวสำหรับนักจิตวิทยาท่านนี้</p>
            <p className="text-sm">เป็นคนแรกที่เขียนรีวิวหลังจากการปรึกษา</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { reviews, statistics } = reviewsData

  return (
    <Card>
      <CardHeader>
        <CardTitle>รีวิวและความคิดเห็น</CardTitle>
        <CardDescription>
          คะแนนเฉลี่ย {averageRating.toFixed(1)} จาก {statistics.totalReviews} รีวิว
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= averageRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {statistics.totalReviews} รีวิว
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = statistics.ratingDistribution[rating] || 0
              const percentage = statistics.totalReviews > 0 
                ? (count / statistics.totalReviews) * 100 
                : 0

              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating} ⭐</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="w-8 text-muted-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            ความคิดเห็นจากผู้ใช้บริการ
          </h4>

          {reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 space-y-3">
              {/* Review Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{review.clientName}</div>
                    <div className="text-xs text-muted-foreground">
                      เซสชันเมื่อ {formatDate(review.sessionDate)}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {formatDate(review.submittedAt)}
                </Badge>
              </div>

              {/* Rating Stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-4 h-4",
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {review.rating}/5
                </span>
              </div>

              {/* Review Content */}
              <div className="text-sm leading-relaxed text-gray-700">
                "{review.feedback}"
              </div>

              {/* Helpful indicator for high ratings */}
              {review.rating >= 4 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <ThumbsUp className="w-3 h-3" />
                  แนะนำ
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {reviewsData.pagination.hasMore && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => loadReviews(false)}
                disabled={loadingMore}
              >
                {loadingMore ? 'กำลังโหลด...' : 'โหลดรีวิวเพิ่มเติม'}
              </Button>
            </div>
          )}

          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">ยังไม่มีรีวิวที่มีความคิดเห็น</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}