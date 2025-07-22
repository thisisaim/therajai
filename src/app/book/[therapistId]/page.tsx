'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Video, 
  MapPin,
  User,
  Star,
  Shield,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface TherapistProfile {
  id: string
  name: string
  therapistProfile: {
    firstName: string
    lastName: string
    title: string
    specializations: string[]
    experience: number
    hourlyRate: number
    bio: string
    verified: boolean
    rating: number
    totalSessions: number
    availableOnline: boolean
    availableInPerson: boolean
    address?: string
  }
}

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export default function BookTherapistPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  
  // Booking form state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionType, setSessionType] = useState<'online' | 'in-person'>('online')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const therapistId = params?.therapistId as string

  // Generate next 7 days
  const getAvailableDates = () => {
    const dates = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('th-TH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })
    }
    return dates
  }

  const availableDates = getAvailableDates()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && therapistId) {
      fetchTherapist()
    }
  }, [status, therapistId])

  useEffect(() => {
    if (selectedDate && therapistId) {
      fetchTimeSlots()
    } else {
      setTimeSlots([])
      setSelectedTime('')
    }
  }, [selectedDate, therapistId])

  const fetchTimeSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/availability/slots?therapistId=${therapistId}&date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setTimeSlots(data.slots)
      } else {
        setError('ไม่สามารถดึงข้อมูลช่วงเวลาว่างได้')
        setTimeSlots([])
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา')
      setTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const fetchTherapist = async () => {
    try {
      const response = await fetch(`/api/therapists/${therapistId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTherapist(data.therapist)
      } else {
        setError('ไม่พบข้อมูลนักจิตวิทยา')
      }
    } catch (error) {
      console.error('Error fetching therapist:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !session?.user) {
      return
    }

    setIsBooking(true)
    
    try {
      // Create appointment
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          dateTime: appointmentDateTime.toISOString(),
          duration: parseInt(duration),
          type: sessionType.toUpperCase(),
          notes
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to payment page
        router.push(`/payment/${data.appointment.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'เกิดข้อผิดพลาดในการจองนัดหมาย')
      }
    } catch (error) {
      console.error('Booking error:', error)
      setError('เกิดข้อผิดพลาดในการจองนัดหมาย')
    } finally {
      setIsBooking(false)
    }
  }

  const calculateTotal = () => {
    if (!therapist) return 0
    const rate = Number(therapist.therapistProfile.hourlyRate)
    const hours = parseInt(duration) / 60
    return rate * hours
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !therapist) {
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
                  <Link href="/therapists">กลับไปหน้าค้นหา</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (session?.user.role !== 'CLIENT') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="thai-font text-red-600">ไม่มีสิทธิ์เข้าถึง</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>เฉพาะลูกค้าเท่านั้นที่สามารถจองการปรึกษาได้</p>
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

  const profile = therapist.therapistProfile

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/therapists/${therapist.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปดูโปรไฟล์
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Therapist Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src="" alt={therapist.name} />
                  <AvatarFallback className="text-lg">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="thai-font">
                  {profile.title} {therapist.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  {profile.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      ยืนยันแล้ว
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Number(profile.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {Number(profile.rating).toFixed(1)} ({profile.totalSessions} ครั้ง)
                  </span>
                </div>

                {/* Specializations */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">ความเชี่ยวชาญ</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                  <div className="text-lg font-bold text-primary-600">
                    ฿{Number(profile.hourlyRate).toLocaleString()}/ชม.
                  </div>
                  <div className="text-sm text-gray-600">ค่าบริการ</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="thai-font flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  จองการปรึกษา
                </CardTitle>
                <CardDescription>
                  เลือกวันเวลาและรายละเอียดการปรึกษา
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Type */}
                <div>
                  <Label className="text-base font-semibold">ประเภทการปรึกษา</Label>
                  <RadioGroup
                    value={sessionType}
                    onValueChange={(value) => setSessionType(value as 'online' | 'in-person')}
                    className="flex gap-6 mt-3"
                  >
                    {profile.availableOnline && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                          <Video className="h-4 w-4" />
                          ออนไลน์
                        </Label>
                      </div>
                    )}
                    {profile.availableInPerson && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-person" id="in-person" />
                        <Label htmlFor="in-person" className="flex items-center gap-2 cursor-pointer">
                          <MapPin className="h-4 w-4" />
                          พบหน้า
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration" className="text-base font-semibold">ระยะเวลา</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="เลือกระยะเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 ชั่วโมง (60 นาที)</SelectItem>
                      <SelectItem value="90">1.5 ชั่วโมง (90 นาที)</SelectItem>
                      <SelectItem value="120">2 ชั่วโมง (120 นาที)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div>
                  <Label htmlFor="date" className="text-base font-semibold">เลือกวันที่</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="เลือกวันที่" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates.map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <Label className="text-base font-semibold">เลือกเวลา</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                        <span className="ml-2 text-sm text-gray-600">กำลังโหลดช่วงเวลาว่าง...</span>
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">ไม่มีเวลาว่างในวันนี้</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            size="sm"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className="h-10"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold">หมายเหตุ (ไม่บังคับ)</Label>
                  <Textarea
                    id="notes"
                    placeholder="ระบุสิ่งที่คุณต้องการให้นักจิตวิทยาทราบล่วงหน้า..."
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                {selectedDate && selectedTime && (
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="thai-font text-lg">สรุปการจอง</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>นักจิตวิทยา:</span>
                        <span className="font-medium">{profile.title} {therapist.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>วันที่:</span>
                        <span>{availableDates.find(d => d.value === selectedDate)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>เวลา:</span>
                        <span>{selectedTime} น.</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ระยะเวลา:</span>
                        <span>{duration} นาที</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ประเภท:</span>
                        <span>{sessionType === 'online' ? 'ออนไลน์' : 'พบหน้า'}</span>
                      </div>
                      <div className="border-t pt-3 font-semibold">
                        <div className="flex justify-between text-lg">
                          <span>ค่าบริการ:</span>
                          <span className="text-primary-600">฿{calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Book Button */}
                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  className="w-full"
                  size="lg"
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังจอง...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ยืนยันการจองและไปหน้าชำระเงิน
                    </>
                  )}
                </Button>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
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