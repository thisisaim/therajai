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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  FileText,
  Phone,
  Mail,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'

interface TherapistAppointment {
  id: string
  dateTime: string
  endTime?: string
  duration: number
  type: 'ONLINE' | 'IN_PERSON'
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  amount?: number
  notes?: string
  client: {
    id: string
    name: string
    email: string
    clientProfile?: {
      firstName: string
      lastName: string
      phone?: string
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

export default function TherapistAppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<TherapistAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes] = useState<{[key: string]: string}>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && session?.user.role !== 'THERAPIST') {
      router.push('/dashboard')
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
        
        // Initialize session notes
        const notes: {[key: string]: string} = {}
        data.appointments.forEach((apt: TherapistAppointment) => {
          notes[apt.id] = apt.session?.sessionNotes || ''
        })
        setSessionNotes(notes)
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

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setSaving(appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchAppointments() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || 'เกิดข้อผิดพลาดในการอัพเดทสถานะ')
      }
    } catch (error) {
      console.error('Update status error:', error)
      setError('เกิดข้อผิดพลาดในการอัพเดทสถานะ')
    } finally {
      setSaving(null)
    }
  }

  const saveSessionNotes = async (appointmentId: string) => {
    try {
      setSaving(appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: sessionNotes[appointmentId] || '',
          sessionNotes: sessionNotes[appointmentId] || ''
        })
      })

      if (response.ok) {
        setEditingNotes(null)
        fetchAppointments()
      } else {
        const data = await response.json()
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกหมายเหตุ')
      }
    } catch (error) {
      console.error('Save notes error:', error)
      setError('เกิดข้อผิดพลาดในการบันทึกหมายเหตุ')
    } finally {
      setSaving(null)
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

  const isToday = (dateTime: string) => {
    const today = new Date()
    const appointmentDate = new Date(dateTime)
    return today.toDateString() === appointmentDate.toDateString()
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

  const todayAppointments = appointments.filter(apt => 
    apt.status === 'SCHEDULED' && isToday(apt.dateTime)
  )

  const upcomingCount = appointments.filter(apt => 
    apt.status === 'SCHEDULED' && isUpcoming(apt.dateTime)
  ).length

  const completedThisMonth = appointments.filter(apt => {
    const appointmentDate = new Date(apt.dateTime)
    const now = new Date()
    return apt.status === 'COMPLETED' && 
           appointmentDate.getMonth() === now.getMonth() &&
           appointmentDate.getFullYear() === now.getFullYear()
  }).length

  const totalRevenue = appointments.filter(apt => 
    apt.status === 'COMPLETED' && apt.payment?.status === 'COMPLETED'
  ).reduce((total, apt) => total + (apt.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold thai-font mb-2">การนัดหมายของฉัน</h1>
          <p className="text-gray-600">จัดการการนัดหมายและเซสชั่นการปรึกษา</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">วันนี้</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">การนัดหมายวันนี้</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังจะมาถึง</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
              <p className="text-xs text-muted-foreground">นัดหมายที่รอดำเนินการ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสิ้นเดือนนี้</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedThisMonth}</div>
              <p className="text-xs text-muted-foreground">เซสชั่นที่เสร็จสิ้น</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">จากเซสชั่นที่เสร็จสิ้น</p>
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
                  <SelectItem value="no_show">ไม่มาตามนัด</SelectItem>
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
              <p className="text-gray-500">
                การนัดหมายจะปรากฏที่นี่เมื่อลูกค้าจองเวลากับคุณ
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.dateTime)
              const upcoming = isUpcoming(appointment.dateTime)
              const today = isToday(appointment.dateTime)
              
              return (
                <Card key={appointment.id} className={`overflow-hidden ${today ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="" alt={appointment.client.name} />
                          <AvatarFallback>
                            {appointment.client.clientProfile?.firstName?.charAt(0) || appointment.client.name.charAt(0)}
                            {appointment.client.clientProfile?.lastName?.charAt(0) || appointment.client.name.charAt(1)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {appointment.client.clientProfile 
                              ? `${appointment.client.clientProfile.firstName} ${appointment.client.clientProfile.lastName}`
                              : appointment.client.name
                            }
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {date} {today && <Badge variant="outline" className="ml-1 text-xs">วันนี้</Badge>}
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
                          
                          {appointment.client.clientProfile?.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {appointment.client.clientProfile.phone}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {appointment.client.email}
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
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>หมายเหตุจากลูกค้า:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}

                    {/* Session Notes Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-semibold">บันทึกการปรึกษา</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNotes(editingNotes === appointment.id ? null : appointment.id)}
                        >
                          {editingNotes === appointment.id ? (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              ยกเลิก
                            </>
                          ) : (
                            <>
                              <Edit className="h-3 w-3 mr-1" />
                              {appointment.session?.sessionNotes ? 'แก้ไข' : 'เพิ่ม'}บันทึก
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {editingNotes === appointment.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={sessionNotes[appointment.id] || ''}
                            onChange={(e) => setSessionNotes({
                              ...sessionNotes,
                              [appointment.id]: e.target.value
                            })}
                            placeholder="บันทึกการปรึกษา, การวินิจฉัย, แผนการรักษา..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => saveSessionNotes(appointment.id)} 
                              disabled={saving === appointment.id} 
                              size="sm"
                            >
                              {saving === appointment.id ? (
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
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {appointment.session?.sessionNotes ? (
                            <p className="text-gray-700 text-sm">{appointment.session.sessionNotes}</p>
                          ) : (
                            <p className="text-gray-400 italic text-sm">ยังไม่มีบันทึกการปรึกษา</p>
                          )}
                        </div>
                      )}
                    </div>

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
                        {appointment.status === 'SCHEDULED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                              disabled={saving === appointment.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              ทำเสร็จ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, 'NO_SHOW')}
                              disabled={saving === appointment.id}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              ไม่มา
                            </Button>
                          </>
                        )}
                        
                        {appointment.type === 'ONLINE' && appointment.status === 'SCHEDULED' && upcoming && (
                          <Button size="sm" asChild>
                            <Link href={`/video-call/${appointment.id}`}>
                              <Video className="h-3 w-3 mr-1" />
                              เริ่มเซสชั่น
                            </Link>
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
      </div>
    </div>
  )
}