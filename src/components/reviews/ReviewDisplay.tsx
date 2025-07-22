'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MessageCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface ReviewDisplayProps {
  rating: number
  feedback?: string
  therapistName: string
  appointmentDate: Date
  submittedAt?: Date
  className?: string
}

export default function ReviewDisplay({
  rating,
  feedback,
  therapistName,
  appointmentDate,
  submittedAt,
  className
}: ReviewDisplayProps) {
  const getRatingLabel = (rating: number) => {
    const labels = [
      '',
      'ไม่พอใจมาก',
      'ไม่พอใจ',
      'ปานกลาง',
      'พอใจ',
      'พอใจมาก'
    ]
    return labels[rating] || ''
  }

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600'
    if (rating === 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                ความคิดเห็นของคุณ
              </CardTitle>
              <CardDescription>
                เซสชันกับ {therapistName}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            ส่งแล้ว
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">วันที่เซสชัน:</span>
            <span className="font-medium">
              {appointmentDate.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {submittedAt && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground">ส่งความคิดเห็นเมื่อ:</span>
              <span className="font-medium">
                {formatDate(submittedAt)}
              </span>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <h4 className="font-medium">คะแนนที่ให้:</h4>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-5 h-5",
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className={cn("font-medium", getRatingColor(rating))}>
              {rating}/5 - {getRatingLabel(rating)}
            </span>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              ความคิดเห็น:
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm leading-relaxed text-blue-900">
                "{feedback}"
              </p>
            </div>
          </div>
        )}

        {/* Thank you message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-800">
            <CheckCircle className="w-5 h-5 mx-auto mb-2" />
            <p className="text-sm font-medium">
              ขอบคุณสำหรับความคิดเห็นของคุณ!
            </p>
            <p className="text-xs mt-1">
              ความคิดเห็นนี้จะช่วยให้นักจิตวิทยาปรับปรุงการให้บริการ
            </p>
          </div>
        </div>

        {/* Rating breakdown info */}
        {rating >= 4 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              💫 ความคิดเห็นของคุณอาจจะถูกแสดงในโปรไฟล์ของนักจิตวิทยาหลังจากผ่านการตรวจสอบ
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}