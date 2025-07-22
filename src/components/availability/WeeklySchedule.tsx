'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface WeeklySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface WeeklyScheduleProps {
  onScheduleUpdate?: () => void
}

const DAYS_OF_WEEK = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
]

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
})

const DEFAULT_WORK_HOURS = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Monday
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Friday
]

export default function WeeklySchedule({ onScheduleUpdate }: WeeklyScheduleProps) {
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addSlot = () => {
    const newSlot: WeeklySlot = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    }
    setWeeklySlots([...weeklySlots, newSlot])
  }

  const updateSlot = (index: number, updates: Partial<WeeklySlot>) => {
    const updated = weeklySlots.map((slot, i) => 
      i === index ? { ...slot, ...updates } : slot
    )
    setWeeklySlots(updated)
  }

  const removeSlot = (index: number) => {
    setWeeklySlots(weeklySlots.filter((_, i) => i !== index))
  }

  const loadDefaultSchedule = () => {
    setWeeklySlots([...DEFAULT_WORK_HOURS])
  }

  const saveWeeklySchedule = async (replaceAll: boolean = false) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/availability/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklySchedule: weeklySlots,
          replaceAll
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setWeeklySlots([]) // Clear the form
        onScheduleUpdate?.()
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกตารางเวลา')
      }
    } catch (error) {
      console.error('Save schedule error:', error)
      setError('เกิดข้อผิดพลาดในการบันทึกตารางเวลา')
    } finally {
      setSaving(false)
    }
  }

  const clearAllAvailability = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบตารางเวลาทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/availability/bulk', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('ล้างตารางเวลาสำเร็จ')
        onScheduleUpdate?.()
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการล้างตารางเวลา')
      }
    } catch (error) {
      console.error('Clear schedule error:', error)
      setError('เกิดข้อผิดพลาดในการล้างตารางเวลา')
    } finally {
      setSaving(false)
    }
  }

  // Group slots by day
  const slotsByDay = weeklySlots.reduce((acc, slot, index) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = []
    }
    acc[slot.dayOfWeek].push({ ...slot, index })
    return acc
  }, {} as Record<number, (WeeklySlot & { index: number })[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="thai-font flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          ตั้งค่าตารางเวลาประจำสัปดาห์
        </CardTitle>
        <CardDescription>
          สร้างตารางเวลาแบบประจำสัปดาห์ที่จะใช้งานต่อไปเรื่อยๆ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Messages */}
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

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadDefaultSchedule} size="sm">
            <Clock className="h-3 w-3 mr-1" />
            โหลดเวลาทำงานปกติ (จ-ศ 9-17)
          </Button>
          <Button variant="outline" onClick={addSlot} size="sm">
            <Plus className="h-3 w-3 mr-1" />
            เพิ่มช่วงเวลา
          </Button>
        </div>

        {/* Weekly Schedule Grid */}
        {weeklySlots.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-semibold">ตารางเวลาที่กำลังสร้าง</h4>
            
            {/* Show by day */}
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={dayIndex}>
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  {DAYS_OF_WEEK[dayIndex]}
                  {slotsByDay[dayIndex]?.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {slotsByDay[dayIndex].length} ช่วงเวลา
                    </Badge>
                  )}
                </h5>
                
                {slotsByDay[dayIndex]?.length > 0 ? (
                  <div className="grid gap-2">
                    {slotsByDay[dayIndex].map((slot) => (
                      <div key={slot.index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Select 
                            value={slot.startTime} 
                            onValueChange={(value) => updateSlot(slot.index, { startTime: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={slot.endTime} 
                            onValueChange={(value) => updateSlot(slot.index, { endTime: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slot.isAvailable}
                              onCheckedChange={(checked: boolean) => updateSlot(slot.index, { isAvailable: checked })}
                            />
                            <span className="text-sm">
                              {slot.isAvailable ? 'เปิดรับ' : 'ปิดรับ'}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(slot.index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-2">ไม่มีเวลาว่าง</p>
                )}
              </div>
            ))}

            {/* Add individual slot form */}
            <div className="border-t pt-4">
              <Button variant="outline" onClick={addSlot} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มช่วงเวลาใหม่
              </Button>
            </div>

            {/* Save Actions */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={() => saveWeeklySchedule(false)}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  เพิ่มในตารางปัจจุบัน
                </Button>
                
                <Button 
                  onClick={() => saveWeeklySchedule(true)}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  แทนที่ตารางเดิม
                </Button>
              </div>
              
              <Button 
                onClick={clearAllAvailability}
                disabled={saving}
                variant="outline"
                className="w-full text-red-600 hover:text-red-800"
              >
                ล้างตารางเวลาทั้งหมด
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">ยังไม่มีตารางเวลา</p>
            <p className="text-sm text-gray-400 mb-4">
              เริ่มต้นด้วยการโหลดเวลาทำงานปกติ หรือเพิ่มช่วงเวลาใหม่
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}