'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import ReviewSubmission from '@/components/reviews/ReviewSubmission'
import ReviewDisplay from '@/components/reviews/ReviewDisplay'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

interface SessionData {
  id: string
  startTime: string
  endTime?: string
  rating?: number
  clientFeedback?: string
  appointment: {
    id: string
    dateTime: string
    client: {
      id: string
      name: string
      clientProfile?: {
        firstName: string
        lastName: string
      }
    }
    therapist: {
      id: string
      name: string
      therapistProfile: {
        firstName: string
        lastName: string
        title?: string
      }
    }
  }
}

export default function SessionReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.id as string

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      redirect('/auth/login')
    }

    if (session.user.role !== 'CLIENT') {
      redirect('/dashboard')
    }

    loadSessionData()
  }, [session, status, sessionId])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/review`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load session data')
      }

      setSessionData(data.session)
    } catch (error) {
      console.error('Failed to load session:', error)
      setError(error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลเซสชันได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSuccess = () => {
    // Reload session data to show the submitted review
    loadSessionData()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center space-y-4">
          <div className="text-6xl">😔</div>
          <h1 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild>
            <Link href="/dashboard/appointments">
              กลับไปยังการนัดหมาย
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center space-y-4">
          <div className="text-6xl">🤔</div>
          <h1 className="text-2xl font-bold">ไม่พบเซสชัน</h1>
          <p className="text-muted-foreground">ไม่พบเซสชันที่คุณต้องการ</p>
          <Button asChild>
            <Link href="/dashboard/appointments">
              กลับไปยังการนัดหมาย
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const therapistName = `${sessionData.appointment.therapist.therapistProfile.title || ''} ${sessionData.appointment.therapist.therapistProfile.firstName} ${sessionData.appointment.therapist.therapistProfile.lastName}`.trim()
  const appointmentDate = new Date(sessionData.appointment.dateTime)
  const hasRating = sessionData.rating !== null && sessionData.rating !== undefined

  // Check if session is completed
  if (!sessionData.endTime) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/appointments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปยังการนัดหมาย
            </Link>
          </Button>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardContent className="text-center py-12 space-y-4">
              <Clock className="w-16 h-16 text-orange-500 mx-auto" />
              <h1 className="text-2xl font-bold">เซสชันยังไม่เสร็จสิ้น</h1>
              <p className="text-muted-foreground">
                คุณสามารถให้คะแนนและความคิดเห็นได้หลังจากเซสชันเสร็จสิ้นแล้ว
              </p>
              <div className="pt-4">
                <Button asChild>
                  <Link href="/dashboard/appointments">
                    กลับไปยังการนัดหมาย
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/appointments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปยังการนัดหมาย
          </Link>
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">
            {hasRating ? 'ความคิดเห็นของคุณ' : 'ให้คะแนนเซสชัน'}
          </h1>
          <p className="text-muted-foreground">
            เซสชันการบำบัดกับ {therapistName}
          </p>
        </div>
      </div>

      {/* Review Content */}
      <div className="flex justify-center">
        {hasRating ? (
          <ReviewDisplay
            rating={sessionData.rating!}
            feedback={sessionData.clientFeedback || undefined}
            therapistName={therapistName}
            appointmentDate={appointmentDate}
            submittedAt={sessionData.endTime ? new Date(sessionData.endTime) : undefined}
          />
        ) : (
          <ReviewSubmission
            sessionId={sessionId}
            therapistName={therapistName}
            appointmentDate={appointmentDate}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}
      </div>

      {/* Additional actions */}
      {hasRating && (
        <div className="flex justify-center mt-8">
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              ต้องการจองเซสชันใหม่กับ {therapistName}?
            </p>
            <Button asChild variant="outline">
              <Link href={`/therapists/${sessionData.appointment.therapist.id}`}>
                ดูโปรไฟล์นักจิตวิทยา
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}