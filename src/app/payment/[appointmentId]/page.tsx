'use client'

import { PaymentForm } from '@/components/payment/PaymentForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AppointmentData {
  id: string
  dateTime: string
  duration: number
  therapist: {
    name: string
    therapistProfile: {
      hourlyRate: number
    }
  }
  payment?: {
    id: string
    status: string
    amount: number
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  const appointmentId = params?.appointmentId as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchAppointment()
    }
  }, [status, appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      
      if (!response.ok) {
        throw new Error('ไม่พบการนัดหมาย')
      }

      const data = await response.json()
      setAppointment(data.appointment)
    } catch (error) {
      console.error('Error fetching appointment:', error)
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentSuccess(true)
    // Refresh appointment data to show payment status
    fetchAppointment()
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="thai-font text-red-600">เกิดข้อผิดพลาด</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>{error}</p>
                <Button asChild>
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="text-center py-8">
                <p>ไม่พบข้อมูลการนัดหมาย</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (appointment.payment?.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="thai-font text-green-600">ชำระเงินสำเร็จ</CardTitle>
                <CardDescription>
                  การชำระเงินสำหรับการนัดหมายนี้เสร็จสิ้นแล้ว
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-medium">การนัดหมายกับ {appointment.therapist.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.dateTime).toLocaleDateString('th-TH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    ชำระแล้ว ฿{appointment.payment.amount.toLocaleString()}
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="thai-font text-green-600">ชำระเงินสำเร็จ!</CardTitle>
                <CardDescription>
                  การชำระเงินของคุณได้รับการยืนยันแล้ว
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Alert>
                  <AlertDescription>
                    คุณจะได้รับอีเมลยืนยันการชำระเงินและรายละเอียดการนัดหมายในไม่ช้า
                  </AlertDescription>
                </Alert>
                <Button asChild className="w-full">
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const amount = Number(appointment.therapist.therapistProfile.hourlyRate) * (appointment.duration / 60)
  const description = `การปรึกษาจิตวิทยากับ ${appointment.therapist.name} (${appointment.duration} นาที)`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปแดชบอร์ด
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 thai-font">
              ชำระค่าบริการ
            </h1>
            <p className="text-gray-600 mt-2">
              ชำระเงินสำหรับการนัดหมายของคุณอย่างปลอดภัย
            </p>
          </div>

          {/* Appointment Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="thai-font">รายละเอียดการนัดหมาย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>นักจิตวิทยา:</span>
                <span className="font-medium">{appointment.therapist.name}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่และเวลา:</span>
                <span>
                  {new Date(appointment.dateTime).toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ระยะเวลา:</span>
                <span>{appointment.duration} นาที</span>
              </div>
              <div className="flex justify-between">
                <span>อัตราค่าบริการ:</span>
                <span>฿{appointment.therapist.therapistProfile.hourlyRate.toLocaleString()}/ชั่วโมง</span>
              </div>
            </CardContent>
          </Card>

          <PaymentForm
            appointmentId={appointmentId}
            amount={amount}
            description={description}
            therapistName={appointment.therapist.name}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    </div>
  )
}