import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '../route'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { NotificationScheduler } from '@/lib/notification-scheduler'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/notification-scheduler', () => ({
  NotificationScheduler: {
    sendNewAppointmentNotification: jest.fn(),
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-appointment-id'),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockDb = db as jest.Mocked<typeof db>
const mockNotificationScheduler = NotificationScheduler as jest.Mocked<typeof NotificationScheduler>

describe('/api/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any, url = 'http://localhost/api/appointments') => {
    return {
      json: jest.fn().mockResolvedValue(body),
      url,
    } as unknown as NextRequest
  }

  describe('POST /api/appointments', () => {
    const mockClientSession = {
      user: {
        id: 'client123',
        role: 'CLIENT',
        email: 'client@example.com',
      },
    }

    const mockTherapist = {
      id: 'therapist123',
      role: 'THERAPIST',
      therapistProfile: {
        verified: true,
        hourlyRate: 1500,
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
      },
    }

    const mockAppointmentData = {
      therapistId: 'therapist123',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 60,
      type: 'ONLINE',
      notes: 'First session',
    }

    it('should create appointment successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(mockTherapist)
      mockDb.appointment.findFirst.mockResolvedValue(null) // No conflicts
      
      const mockCreatedAppointment = {
        id: 'test-appointment-id',
        clientId: 'client123',
        therapistId: 'therapist123',
        dateTime: new Date(mockAppointmentData.dateTime),
        endTime: new Date(new Date(mockAppointmentData.dateTime).getTime() + 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        notes: 'First session',
        status: 'SCHEDULED',
        amount: 1500,
        client: {
          id: 'client123',
          name: 'Client Name',
          email: 'client@example.com',
          clientProfile: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '123-456-7890',
          },
        },
        therapist: {
          id: 'therapist123',
          name: 'Dr. Jane Smith',
          email: 'therapist@example.com',
          therapistProfile: mockTherapist.therapistProfile,
        },
      }

      mockDb.appointment.create.mockResolvedValue(mockCreatedAppointment)
      mockNotificationScheduler.sendNewAppointmentNotification.mockResolvedValue(undefined)

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.appointment).toMatchObject({
        id: 'test-appointment-id',
        clientId: 'client123',
        therapistId: 'therapist123',
        status: 'SCHEDULED',
        duration: 60,
        notes: 'First session',
        client: { id: 'client123', name: 'Client Name', email: 'client@example.com' },
        therapist: { id: 'therapist123', name: 'Dr. Jane Smith', email: 'therapist@example.com' },
      })
      expect(data.appointment.dateTime).toEqual(expect.any(String))
      expect(data.appointment.endTime).toEqual(expect.any(String))
      expect(data.message).toBe('สร้างการนัดหมายสำเร็จ')
    })

    it('should reject if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ไม่พบการเข้าสู่ระบบ')
    })

    it('should reject if user is not a client', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'therapist123', role: 'THERAPIST' },
      })

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('เฉพาะลูกค้าเท่านั้นที่สามารถจองการปรึกษาได้')
    })

    it('should reject if required fields are missing', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)

      const incompleteData = {
        therapistId: 'therapist123',
        // Missing dateTime, duration, type
      }

      const request = createMockRequest(incompleteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('กรุณากรอกข้อมูลให้ครบถ้วน')
    })

    it('should reject if therapist is not found or not verified', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(null)

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('ไม่พบนักจิตวิทยาที่ระบุ')
    })

    it('should reject if appointment is in the past', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(mockTherapist)

      const pastAppointmentData = {
        ...mockAppointmentData,
        dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      }

      const request = createMockRequest(pastAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ไม่สามารถจองย้อนหลังได้')
    })

    it('should reject if duration is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(mockTherapist)

      const invalidDurationData = {
        ...mockAppointmentData,
        duration: 45, // Invalid duration
      }

      const request = createMockRequest(invalidDurationData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ระยะเวลาไม่ถูกต้อง')
    })

    it('should reject if there is a conflicting appointment', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(mockTherapist)
      mockDb.appointment.findFirst.mockResolvedValue({
        id: 'existing-appointment',
        therapistId: 'therapist123',
        dateTime: new Date(mockAppointmentData.dateTime),
        status: 'SCHEDULED',
      })

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น')
    })

    it('should handle notification failure gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.user.findUnique.mockResolvedValue(mockTherapist)
      mockDb.appointment.findFirst.mockResolvedValue(null)
      
      const mockCreatedAppointment = {
        id: 'test-appointment-id',
        clientId: 'client123',
        therapistId: 'therapist123',
        dateTime: new Date(mockAppointmentData.dateTime),
        endTime: new Date(new Date(mockAppointmentData.dateTime).getTime() + 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        notes: 'First session',
        status: 'SCHEDULED',
        amount: 1500,
        client: { id: 'client123', name: 'Client Name', email: 'client@example.com', clientProfile: null },
        therapist: { id: 'therapist123', name: 'Dr. Jane Smith', email: 'therapist@example.com', therapistProfile: mockTherapist.therapistProfile },
      }

      mockDb.appointment.create.mockResolvedValue(mockCreatedAppointment)
      mockNotificationScheduler.sendNewAppointmentNotification.mockRejectedValue(new Error('Notification failed'))

      const request = createMockRequest(mockAppointmentData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Appointment should still be created even if notification fails
    })
  })

  describe('GET /api/appointments', () => {
    const mockClientSession = {
      user: {
        id: 'client123',
        role: 'CLIENT',
        email: 'client@example.com',
      },
    }

    const mockAppointments = [
      {
        id: 'appointment1',
        clientId: 'client123',
        therapistId: 'therapist123',
        dateTime: new Date(),
        status: 'SCHEDULED',
        client: { id: 'client123', name: 'Client Name', email: 'client@example.com', clientProfile: null },
        therapist: { id: 'therapist123', name: 'Dr. Jane Smith', email: 'therapist@example.com', therapistProfile: null },
        payment: null,
        session: null,
      },
    ]

    it('should get appointments for client', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.appointment.findMany.mockResolvedValue(mockAppointments)
      mockDb.appointment.count.mockResolvedValue(1)

      const request = createMockRequest({}, 'http://localhost/api/appointments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.appointments[0]).toMatchObject({
        id: 'appointment1',
        clientId: 'client123',
        therapistId: 'therapist123',
        status: 'SCHEDULED',
        client: { id: 'client123', name: 'Client Name', email: 'client@example.com', clientProfile: null },
        therapist: { id: 'therapist123', name: 'Dr. Jane Smith', email: 'therapist@example.com', therapistProfile: null },
        payment: null,
        session: null,
      })
      expect(data.appointments[0].dateTime).toEqual(expect.any(String))
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      })
    })

    it('should filter appointments by status', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.appointment.findMany.mockResolvedValue(mockAppointments)
      mockDb.appointment.count.mockResolvedValue(1)

      const request = createMockRequest({}, 'http://localhost/api/appointments?status=SCHEDULED')
      const response = await GET(request)

      expect(mockDb.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: 'client123',
            status: 'SCHEDULED',
          }),
        })
      )
    })

    it('should handle pagination', async () => {
      mockGetServerSession.mockResolvedValue(mockClientSession)
      mockDb.appointment.findMany.mockResolvedValue(mockAppointments)
      mockDb.appointment.count.mockResolvedValue(25)

      const request = createMockRequest({}, 'http://localhost/api/appointments?page=2&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        pages: 5,
      })

      expect(mockDb.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      )
    })

    it('should reject if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest({}, 'http://localhost/api/appointments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('ไม่พบการเข้าสู่ระบบ')
    })

    it('should handle therapist role correctly', async () => {
      const therapistSession = {
        user: { id: 'therapist123', role: 'THERAPIST' },
      }

      mockGetServerSession.mockResolvedValue(therapistSession)
      mockDb.appointment.findMany.mockResolvedValue(mockAppointments)
      mockDb.appointment.count.mockResolvedValue(1)

      const request = createMockRequest({}, 'http://localhost/api/appointments')
      await GET(request)

      expect(mockDb.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            therapistId: 'therapist123',
          }),
        })
      )
    })

    it('should handle admin role with filters', async () => {
      const adminSession = {
        user: { id: 'admin123', role: 'ADMIN' },
      }

      mockGetServerSession.mockResolvedValue(adminSession)
      mockDb.appointment.findMany.mockResolvedValue(mockAppointments)
      mockDb.appointment.count.mockResolvedValue(1)

      const request = createMockRequest({}, 'http://localhost/api/appointments?therapistId=therapist123&clientId=client123')
      await GET(request)

      expect(mockDb.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            therapistId: 'therapist123',
            clientId: 'client123',
          }),
        })
      )
    })
  })
})