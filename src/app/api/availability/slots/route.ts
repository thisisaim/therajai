import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ไม่พบการเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const date = searchParams.get('date')

    if (!therapistId || !date) {
      return NextResponse.json(
        { error: 'กรุณาระบุ therapistId และ date' },
        { status: 400 }
      )
    }

    // Parse the date and get day of week
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'รูปแบบวันที่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const dayOfWeek = targetDate.getDay()

    // Get therapist's availability for this day
    const availability = await db.therapistAvailability.findMany({
      where: {
        therapist: {
          userId: therapistId
        },
        dayOfWeek,
        isAvailable: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    if (availability.length === 0) {
      return NextResponse.json({
        success: true,
        slots: []
      })
    }

    // Get existing appointments for this date
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await db.appointment.findMany({
      where: {
        therapistId,
        status: 'SCHEDULED',
        dateTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        dateTime: true,
        duration: true
      }
    })

    // Generate time slots based on availability
    const slots = []
    
    for (const availSlot of availability) {
      const [startHour, startMinute] = availSlot.startTime.split(':').map(Number)
      const [endHour, endMinute] = availSlot.endTime.split(':').map(Number)
      
      // Generate 30-minute slots within this availability window
      let currentTime = new Date(targetDate)
      currentTime.setHours(startHour, startMinute, 0, 0)
      
      const endTime = new Date(targetDate)
      endTime.setHours(endHour, endMinute, 0, 0)
      
      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().slice(0, 5)
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.dateTime)
          const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
          const slotEnd = new Date(currentTime.getTime() + 30 * 60000) // 30-minute slots
          
          return (currentTime < aptEnd && slotEnd > aptStart)
        })
        
        // Only include future time slots (not past)
        const now = new Date()
        const isInFuture = currentTime > now
        
        slots.push({
          id: `${date}-${timeString}`,
          time: timeString,
          available: !hasConflict && isInFuture
        })
        
        // Move to next 30-minute slot
        currentTime.setMinutes(currentTime.getMinutes() + 30)
      }
    }

    return NextResponse.json({
      success: true,
      slots
    })

  } catch (error) {
    console.error('Get availability slots error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาว่าง' },
      { status: 500 }
    )
  }
}