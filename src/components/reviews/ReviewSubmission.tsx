'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Star, ThumbsUp, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewSubmissionProps {
  sessionId: string
  therapistName: string
  appointmentDate: Date
  onSubmitSuccess?: () => void
  className?: string
}

export default function ReviewSubmission({
  sessionId,
  therapistName,
  appointmentDate,
  onSubmitSuccess,
  className
}: ReviewSubmissionProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'กรุณาให้คะแนน',
        description: 'โปรดให้คะแนน 1-5 ดาวก่อนส่งความคิดเห็น',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast({
        title: 'ขอบคุณสำหรับความคิดเห็น',
        description: 'การให้คะแนนและความคิดเห็นของคุณได้รับการบันทึกเรียบร้อยแล้ว',
      })

      if (onSubmitSuccess) {
        onSubmitSuccess()
      }

    } catch (error) {
      console.error('Submit review error:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถบันทึกความคิดเห็นได้',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingLabels = [
    '',
    'ไม่พอใจมาก',
    'ไม่พอใจ',
    'ปานกลาง',
    'พอใจ',
    'พอใจมาก'
  ]

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
            <ThumbsUp className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">
          ให้คะแนนเซสชันการบำบัด
        </CardTitle>
        <CardDescription>
          กับ {therapistName} • {appointmentDate.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rating Stars */}
        <div className="text-center space-y-4">
          <Label className="text-base font-medium">
            โปรดให้คะแนนความพอใจของคุณ
          </Label>
          
          <div className="flex justify-center items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hoveredRating >= star || rating >= star)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              </button>
            ))}
          </div>

          {(hoveredRating > 0 || rating > 0) && (
            <p className="text-sm text-muted-foreground animate-fade-in">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-base font-medium flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            แบ่งปันความคิดเห็น (ไม่บังคับ)
          </Label>
          <Textarea
            id="feedback"
            placeholder="เล่าถึงประสบการณ์ของคุณกับนักจิตวิทยา เช่น ความเข้าใจ ความช่วยเหลือ หรือสิ่งที่ควรปรับปรุง..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <div className="text-xs text-muted-foreground text-right">
            {feedback.length}/1000 ตัวอักษร
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900">💡 แนวทางการให้ความคิดเห็น</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ความคิดเห็นของคุณจะช่วยให้นักจิตวิทยาปรับปรุงการให้บริการ</li>
            <li>• โปรดให้ความคิดเห็นที่สร้างสรรค์และเป็นประโยชน์</li>
            <li>• หลีกเลี่ยงการเปิดเผยข้อมูลส่วนตัวหรืออ่อนไหว</li>
            <li>• ความคิดเห็นจะถูกตรวจสอบก่อนแสดงในโปรไฟล์นักจิตวิทยา</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full max-w-xs h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4 mr-2" />
                ส่งความคิดเห็น
              </>
            )}
          </Button>
        </div>

        {rating === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            กรุณาให้คะแนนก่อนส่งความคิดเห็น
          </p>
        )}
      </CardContent>
    </Card>
  )
}