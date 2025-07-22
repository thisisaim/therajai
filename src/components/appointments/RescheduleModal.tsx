'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  RefreshCw
} from 'lucide-react'

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

interface RescheduleModalProps {
  appointmentId: string
  currentDateTime: string
  currentDuration: number
  therapistId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RescheduleModal({
  appointmentId,
  currentDateTime,
  currentDuration,
  therapistId,
  onClose,
  onSuccess
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(currentDuration.toString())
  const [reason, setReason] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Generate next 14 days (excluding current appointment date)
  const getAvailableDates = () => {
    const dates = []
    const currentDate = new Date(currentDateTime).toDateString()
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      // Skip current appointment date
      if (date.toDateString() === currentDate) continue
      
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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('กรุณาเลือกวันเวลาใหม่')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const newDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDateTime: newDateTime.toISOString(),
          newDuration: parseInt(duration),
          reason
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนแปลงการนัดหมาย')
      }
    } catch (error) {
      console.error('Reschedule error:', error)
      setError('เกิดข้อผิดพลาดในการเปลี่ยนแปลงการนัดหมาย')
    } finally {
      setSaving(false)
    }
  }

  const calculateHoursUntilAppointment = () => {
    const appointmentTime = new Date(currentDateTime)
    const now = new Date()
    return (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  }

  const hoursUntil = calculateHoursUntilAppointment()
  const canReschedule = hoursUntil >= 2
  const isFreeReschedule = hoursUntil >= 24
  const hasFee = hoursUntil >= 2 && hoursUntil < 24

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="thai-font flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  เปลี่ยนแปลงการนัดหมาย
                </CardTitle>
                <CardDescription>
                  เลือกวันเวลาใหม่สำหรับการปรึกษา
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Policy Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">นีตการเปลี่ยนแปลงการนัดหมาย:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 24 ชั่วโมงขึ้นไป: ฟรี</li>
                    <li>• 2-24 ชั่วโมง: ค่าธรรมเนียม ฿200</li>
                    <li>• น้อยกว่า 2 ชั่วโมง: ไม่สามารถเปลี่ยนแปลงได้</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {!canReschedule && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  ไม่สามารถเปลี่ยนแปลงการนัดหมายได้เนื่องจากใกล้เวลานัดหมายมาก (น้อยกว่า 2 ชั่วโมง)
                </AlertDescription>
              </Alert>
            )}

            {hasFee && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  การเปลี่ยนแปลงนี้จะมีค่าธรรมเนียม ฿200 เนื่องจากใกล้เวลานัดหมาย
                </AlertDescription>
              </Alert>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {/* Current Appointment Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">การนัดหมายปัจจุบัน</h4>
              <div className="text-sm text-gray-600">
                <p>วันเวลา: {new Date(currentDateTime).toLocaleString('th-TH')}</p>
                <p>ระยะเวลา: {currentDuration} นาที</p>
              </div>
            </div>

            {canReschedule && (
              <>
                {/* Duration Selection */}
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
                  <Label htmlFor="date" className="text-base font-semibold">เลือกวันที่ใหม่</Label>
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
                    <Label className="text-base font-semibold">เลือกเวลาใหม่</Label>
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

                {/* Reason */}
                <div>
                  <Label htmlFor="reason" className="text-base font-semibold">เหตุผลในการเปลี่ยนแปลง</Label>
                  <Textarea
                    id="reason"
                    placeholder="ระบุเหตุผลในการเปลี่ยนแปลงการนัดหมาย..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                {selectedDate && selectedTime && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">สรุปการเปลี่ยนแปลง</h4>
                    <div className="text-sm space-y-1">
                      <p>วันเวลาใหม่: {availableDates.find(d => d.value === selectedDate)?.label} {selectedTime} น.</p>
                      <p>ระยะเวลา: {duration} นาที</p>
                      {hasFee && <p className="text-orange-600 font-medium">ค่าธรรมเนียม: ฿200</p>}
                      {isFreeReschedule && <p className="text-green-600 font-medium">ไม่มีค่าธรรมเนียม</p>}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReschedule}
                    disabled={!selectedDate || !selectedTime || saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        ยืนยันการเปลี่ยนแปลง
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    ยกเลิก
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}