'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin,
  User,
  Star,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import CancelModal from '@/components/appointments/CancelModal'
import RescheduleModal from '@/components/appointments/RescheduleModal'

interface Appointment {
  id: string
  dateTime: string
  endTime?: string
  duration: number
  type: 'ONLINE' | 'IN_PERSON'
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  amount?: number
  notes?: string
  therapist: {
    id: string
    name: string
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
  }
  session?: {
    id: string
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

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null)
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchAppointments()
    }
  }, [status])

  const fetchAppointments = async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      
      const response = await fetch(`/api/appointments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      } else {
        setError('ไม่สามารถดึงข้อมูลการนัดหมายได้')
      }
    } catch (error) {
      console.error('Fetch appointments error:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleModalSuccess = () => {
    fetchAppointments() // Refresh the list
    setError(null) // Clear any existing errors
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

  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'SCHEDULED' && 
           isUpcoming(appointment.dateTime) &&
           (!appointment.payment || appointment.payment.status !== 'COMPLETED')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const filteredAppointments = appointments.filter(apt => 
    filterStatus === 'all' || apt.status === filterStatus.toUpperCase()
  )

  const upcomingCount = appointments.filter(apt => 
    apt.status === 'SCHEDULED' && isUpcoming(apt.dateTime)
  ).length

  const completedCount = appointments.filter(apt => 
    apt.status === 'COMPLETED'
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold thai-font mb-2">การนัดหมายของฉัน</h1>
          <p className="text-gray-600">จัดการและติดตามการนัดหมายปรึกษาของคุณ</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การนัดหมายที่กำลังจะมาถึง</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <p className="text-xs text-muted-foreground">นัดหมายที่รอดำเนินการ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสิ้นแล้ว</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">การปรึกษาที่ผ่านมา</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">การนัดหมายทั้งหมด</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="scheduled">กำหนดการ</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={fetchAppointments}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            รีเฟรช
          </Button>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {filterStatus === 'all' ? 'ยังไม่มีการนัดหมาย' : 'ไม่พบการนัดหมายในสถานะนี้'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filterStatus === 'all' 
                  ? 'เริ่มต้นค้นหานักจิตวิทยาและจองการปรึกษาแรกของคุณ'
                  : 'ลองเปลี่ยนตัวกรองเพื่อดูการนัดหมายอื่น'
                }
              </p>
              {filterStatus === 'all' && (
                <Button asChild>
                  <Link href="/therapists">ค้นหานักจิตวิทยา</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.dateTime)
              const upcoming = isUpcoming(appointment.dateTime)
              
              return (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="" alt={appointment.therapist.name} />
                          <AvatarFallback>
                            {appointment.therapist.therapistProfile.firstName.charAt(0)}
                            {appointment.therapist.therapistProfile.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {appointment.therapist.therapistProfile.title} {appointment.therapist.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {time} น. ({appointment.duration} นาที)
                            </div>
                            <div className="flex items-center gap-1">
                              {appointment.type === 'ONLINE' ? (
                                <>
                                  <Video className="h-4 w-4" />
                                  ออนไลน์
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4" />
                                  พบหน้า
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

                    {appointment.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>หมายเหตุ:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        {appointment.amount && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            ฿{appointment.amount.toLocaleString()}
                          </div>
                        )}
                        {appointment.session?.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{appointment.session.rating}/5</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {appointment.status === 'SCHEDULED' && upcoming && (
                          <>
                            {appointment.payment?.status === 'PENDING' && (
                              <Button size="sm" asChild>
                                <Link href={`/payment/${appointment.id}`}>
                                  ชำระเงิน
                                </Link>
                              </Button>
                            )}
                            {appointment.type === 'ONLINE' && appointment.payment?.status === 'COMPLETED' && (
                              <Button size="sm" asChild>
                                <Link href={`/video-call/${appointment.id}`}>
                                  <Video className="h-3 w-3 mr-1" />
                                  เข้าร่วมการปรึกษา
                                </Link>
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/dashboard/appointments/${appointment.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            ดูรายละเอียด
                          </Link>
                        </Button>

                        {appointment.status === 'SCHEDULED' && upcoming && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReschedulingAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            เปลี่ยนแปลง
                          </Button>
                        )}

                        {canCancel(appointment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancellingAppointment(appointment)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            ยกเลิก
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Modals */}
        {cancellingAppointment && (
          <CancelModal
            appointmentId={cancellingAppointment.id}
            appointmentDateTime={cancellingAppointment.dateTime}
            paymentStatus={cancellingAppointment.payment?.status}
            paymentAmount={cancellingAppointment.payment?.amount}
            onClose={() => setCancellingAppointment(null)}
            onSuccess={handleModalSuccess}
          />
        )}

        {reschedulingAppointment && (
          <RescheduleModal
            appointmentId={reschedulingAppointment.id}
            currentDateTime={reschedulingAppointment.dateTime}
            currentDuration={reschedulingAppointment.duration}
            therapistId={reschedulingAppointment.therapist.id}
            onClose={() => setReschedulingAppointment(null)}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </div>
  )
}