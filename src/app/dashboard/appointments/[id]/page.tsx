'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Calendar, 
  Clock, 
  Video, 
  MapPin,
  User,
  Star,
  DollarSign,
  MessageSquare,
  FileText,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'

interface AppointmentDetail {
  id: string
  dateTime: string
  endTime?: string
  duration: number
  type: 'ONLINE' | 'IN_PERSON'
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  amount?: number
  notes?: string
  sessionLink?: string
  client: {
    id: string
    name: string
    email: string
  }
  therapist: {
    id: string
    name: string
    email: string
    therapistProfile: {
      firstName: string
      lastName: string
      title: string
      hourlyRate: number
    }
  }
  payment?: {
    id: string
    amount: number
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    paymentMethod: string
    createdAt: string
    receiptUrl?: string
  }
  session?: {
    id: string
    startTime?: string
    endTime?: string
    sessionNotes?: string
    rating?: number
  }
}

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS = {
  SCHEDULED: 'กำหนดการ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
  NO_SHOW: 'ไม่มาตามนัด'
}

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800'
}

const PAYMENT_STATUS_LABELS = {
  PENDING: 'รอชำระ',
  COMPLETED: 'ชำระแล้ว',
  FAILED: 'ชำระไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว'
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const appointmentId = params?.id as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && appointmentId) {
      fetchAppointment()
    }
  }, [status, appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setNewNotes(data.appointment.notes || '')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'ไม่พบข้อมูลการนัดหมาย')
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const updateNotes = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes })
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setEditingNotes(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'เกิดข้อผิดพลาดในการอัพเดทหมายเหตุ')
      }
    } catch (error) {
      console.error('Update notes error:', error)
      setError('เกิดข้อผิดพลาดในการอัพเดทหมายเหตุ')
    } finally {
      setSaving(false)
    }
  }

  const cancelAppointment = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการนัดหมายนี้?')) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/appointments')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'เกิดข้อผิดพลาดในการยกเลิกนัดหมาย')
      }
    } catch (error) {
      console.error('Cancel appointment error:', error)
      setError('เกิดข้อผิดพลาดในการยกเลิกนัดหมาย')
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const isUpcoming = (dateTime: string) => {
    return new Date(dateTime) > new Date()
  }

  const canCancel = (appointment: AppointmentDetail) => {
    return appointment.status === 'SCHEDULED' && 
           isUpcoming(appointment.dateTime) &&
           (!appointment.payment || appointment.payment.status !== 'COMPLETED')
  }

  const canJoinCall = (appointment: AppointmentDetail) => {
    return appointment.status === 'SCHEDULED' && 
           appointment.type === 'ONLINE' &&
           appointment.payment?.status === 'COMPLETED' &&
           isUpcoming(appointment.dateTime)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="thai-font text-red-600">เกิดข้อผิดพลาด</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>{error}</p>
                <Button asChild>
                  <Link href="/dashboard/appointments">กลับไปรายการนัดหมาย</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const { date, time } = formatDateTime(appointment.dateTime)
  const upcoming = isUpcoming(appointment.dateTime)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/appointments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปรายการนัดหมาย
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Appointment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="thai-font text-xl mb-2">รายละเอียดการนัดหมาย</CardTitle>
                    <CardDescription>ข้อมูลการปรึกษาของคุณ</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={STATUS_COLORS[appointment.status]}>
                      {STATUS_LABELS[appointment.status]}
                    </Badge>
                    {appointment.payment && (
                      <Badge className={PAYMENT_STATUS_COLORS[appointment.payment.status]}>
                        {PAYMENT_STATUS_LABELS[appointment.payment.status]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Therapist Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="" alt={appointment.therapist.name} />
                    <AvatarFallback className="text-lg">
                      {appointment.therapist.therapistProfile.firstName.charAt(0)}
                      {appointment.therapist.therapistProfile.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {appointment.therapist.therapistProfile.title} {appointment.therapist.name}
                    </h3>
                    <p className="text-gray-600">{appointment.therapist.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        ฿{Number(appointment.therapist.therapistProfile.hourlyRate).toLocaleString()}/ชม.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium">{date}</p>
                      <p className="text-sm text-gray-600">วันนัดหมาย</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium">{time} น.</p>
                      <p className="text-sm text-gray-600">{appointment.duration} นาที</p>
                    </div>
                  </div>
                </div>

                {/* Session Type */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {appointment.type === 'ONLINE' ? (
                    <>
                      <Video className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">การปรึกษาออนไลน์</p>
                        <p className="text-sm text-gray-600">ผ่านระบบ Video Call</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">การปรึกษาพบหน้า</p>
                        <p className="text-sm text-gray-600">ที่คลินิกของนักจิตวิทยา</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-base font-semibold">หมายเหตุ</Label>
                    {session?.user.role === 'CLIENT' && appointment.status === 'SCHEDULED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNotes(!editingNotes)}
                      >
                        {editingNotes ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            ยกเลิก
                          </>
                        ) : (
                          <>
                            <Edit className="h-3 w-3 mr-1" />
                            แก้ไข
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {editingNotes ? (
                    <div className="space-y-3">
                      <Textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="เพิ่มหมายเหตุสำหรับนักจิตวิทยา..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={updateNotes} disabled={saving} size="sm">
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              กำลังบันทึก...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              บันทึก
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setEditingNotes(false)
                          setNewNotes(appointment.notes || '')
                        }} size="sm">
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {appointment.notes ? (
                        <p className="text-gray-700">{appointment.notes}</p>
                      ) : (
                        <p className="text-gray-400 italic">ไม่มีหมายเหตุ</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Notes (if completed) */}
            {appointment.session?.sessionNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="thai-font flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    บันทึกการปรึกษา
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700">{appointment.session.sessionNotes}</p>
                  </div>
                  {appointment.session.rating && (
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-sm text-gray-600">คะแนนที่ให้:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (appointment.session?.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({appointment.session.rating}/5)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="thai-font">การดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointment.payment?.status === 'PENDING' && (
                  <Button className="w-full" asChild>
                    <Link href={`/payment/${appointment.id}`}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      ชำระเงิน
                    </Link>
                  </Button>
                )}

                {canJoinCall(appointment) && (
                  <Button className="w-full" asChild>
                    <Link href={`/video-call/${appointment.id}`}>
                      <Video className="h-4 w-4 mr-2" />
                      เข้าร่วมการปรึกษา
                    </Link>
                  </Button>
                )}

                {canCancel(appointment) && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-800"
                    onClick={cancelAppointment}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    ยกเลิกการนัดหมาย
                  </Button>
                )}

                {/* Review Button for completed sessions */}
                {appointment.session && appointment.session.endTime && session?.user.role === 'CLIENT' && (
                  <Button className="w-full" asChild variant={appointment.session.rating ? "outline" : "default"}>
                    <Link href={`/dashboard/sessions/${appointment.session.id}/review`}>
                      <Star className="h-4 w-4 mr-2" />
                      {appointment.session.rating ? 'ดูความคิดเห็นของฉัน' : 'ให้คะแนนเซสชัน'}
                    </Link>
                  </Button>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/therapists/${appointment.therapist.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    ดูโปรไฟล์นักจิตวิทยา
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {appointment.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="thai-font flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    ข้อมูลการชำระเงิน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวนเงิน:</span>
                    <span className="font-medium">
                      ฿{appointment.payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">สถานะ:</span>
                    <Badge className={PAYMENT_STATUS_COLORS[appointment.payment.status]}>
                      {PAYMENT_STATUS_LABELS[appointment.payment.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วิธีชำระ:</span>
                    <span className="text-sm">{appointment.payment.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่ชำระ:</span>
                    <span className="text-sm">
                      {new Date(appointment.payment.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  {appointment.payment.receiptUrl && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={appointment.payment.receiptUrl} target="_blank">
                        ดูใบเสร็จ
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="thai-font">ข้อมูลเพิ่มเติม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">รหัสนัดหมาย:</span>
                  <span className="font-mono">{appointment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">สร้างเมื่อ:</span>
                  <span>
                    {new Date(appointment.dateTime).toLocaleDateString('th-TH')}
                  </span>
                </div>
                {appointment.session && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">รหัสเซสชั่น:</span>
                    <span className="font-mono">{appointment.session.id}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}