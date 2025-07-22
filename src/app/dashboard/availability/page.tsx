'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import WeeklySchedule from '@/components/availability/WeeklySchedule'

interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

const DAYS_OF_WEEK = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
]

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

export default function AvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true
  })

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
      fetchAvailability()
    }
  }, [status, session])

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability')
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability)
      } else {
        setError('ไม่สามารถดึงข้อมูลเวลาว่างได้')
      }
    } catch (error) {
      console.error('Fetch availability error:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const addSlot = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlot)
      })

      const data = await response.json()

      if (response.ok) {
        setAvailability([...availability, data.availability])
        setNewSlot({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true
        })
        setSuccess('เพิ่มเวลาว่างสำเร็จ')
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการเพิ่มเวลาว่าง')
      }
    } catch (error) {
      console.error('Add slot error:', error)
      setError('เกิดข้อผิดพลาดในการเพิ่มเวลาว่าง')
    } finally {
      setSaving(false)
    }
  }

  const updateSlot = async (id: string, updates: Partial<AvailabilitySlot>) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        setAvailability(availability.map(slot => 
          slot.id === id ? data.availability : slot
        ))
        setEditingSlot(null)
        setSuccess('อัพเดทเวลาว่างสำเร็จ')
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการอัพเดท')
      }
    } catch (error) {
      console.error('Update slot error:', error)
      setError('เกิดข้อผิดพลาดในการอัพเดท')
    } finally {
      setSaving(false)
    }
  }

  const deleteSlot = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบช่วงเวลานี้?')) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setAvailability(availability.filter(slot => slot.id !== id))
        setSuccess('ลบเวลาว่างสำเร็จ')
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการลบ')
      }
    } catch (error) {
      console.error('Delete slot error:', error)
      setError('เกิดข้อผิดพลาดในการลบ')
    } finally {
      setSaving(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Group availability by day
  const availabilityByDay = availability.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = []
    }
    acc[slot.dayOfWeek].push(slot)
    return acc
  }, {} as Record<number, AvailabilitySlot[]>)

  // Sort slots within each day by start time
  Object.keys(availabilityByDay).forEach(day => {
    availabilityByDay[parseInt(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold thai-font mb-2">จัดการเวลาว่าง</h1>
          <p className="text-gray-600">ตั้งค่าเวลาที่คุณพร้อมให้บริการปรึกษา</p>
        </div>

        {/* Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearMessages}
                className="ml-2 h-auto p-0 text-red-600 hover:text-red-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearMessages}
                className="ml-2 h-auto p-0 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add New Slot */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="thai-font flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  เพิ่มเวลาว่าง
                </CardTitle>
                <CardDescription>
                  เพิ่มช่วงเวลาใหม่ที่คุณพร้อมให้บริการ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="day">วัน</Label>
                  <Select 
                    value={newSlot.dayOfWeek.toString()} 
                    onValueChange={(value) => setNewSlot({...newSlot, dayOfWeek: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startTime">เวลาเริ่ม</Label>
                  <Select 
                    value={newSlot.startTime} 
                    onValueChange={(value) => setNewSlot({...newSlot, startTime: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time} น.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endTime">เวลาสิ้นสุด</Label>
                  <Select 
                    value={newSlot.endTime} 
                    onValueChange={(value) => setNewSlot({...newSlot, endTime: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time} น.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={newSlot.isAvailable}
                    onCheckedChange={(checked: boolean) => setNewSlot({...newSlot, isAvailable: checked})}
                  />
                  <Label htmlFor="available">เปิดรับนัดหมาย</Label>
                </div>

                <Button 
                  onClick={addSlot}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      กำลังเพิ่ม...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มเวลาว่าง
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="thai-font flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  ตารางเวลาปัจจุบัน
                </CardTitle>
                <CardDescription>
                  เวลาที่คุณพร้อมให้บริการในแต่ละวัน
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availability.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">ยังไม่มีการตั้งเวลาว่าง</p>
                    <p className="text-sm text-gray-400">เพิ่มเวลาว่างเพื่อให้ลูกค้าสามารถจองนัดหมายได้</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Array.from({ length: 7 }, (_, dayIndex) => (
                      <div key={dayIndex}>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {DAYS_OF_WEEK[dayIndex]}
                          {availabilityByDay[dayIndex]?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {availabilityByDay[dayIndex].length} ช่วงเวลา
                            </Badge>
                          )}
                        </h3>
                        
                        {availabilityByDay[dayIndex]?.length > 0 ? (
                          <div className="grid gap-2">
                            {availabilityByDay[dayIndex].map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-white"
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {slot.startTime} - {slot.endTime} น.
                                  </span>
                                  <Badge 
                                    variant={slot.isAvailable ? "default" : "secondary"}
                                    className={slot.isAvailable ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {slot.isAvailable ? 'เปิดรับนัดหมาย' : 'ปิดรับนัดหมาย'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingSlot(slot.id)}
                                    disabled={saving}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteSlot(slot.id)}
                                    disabled={saving}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm py-2">ไม่มีเวลาว่าง</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weekly Schedule Management */}
        <div className="mt-8">
          <WeeklySchedule onScheduleUpdate={fetchAvailability} />
        </div>
      </div>
    </div>
  )
}