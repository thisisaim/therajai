import { NextRequest } from 'next/server'
import { POST } from '../route'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

const mockDb = db as jest.Mocked<typeof db>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest
  }

  it('should register a new user successfully', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'CLIENT'
    }

    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: 'CLIENT',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockDb.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('hashedPassword')
    mockDb.user.create.mockResolvedValue(mockUser)

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe('สมัครสมาชิกสำเร็จ')
    expect(data.user).toMatchObject({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'CLIENT',
      verified: false,
    })
    expect(data.user.createdAt).toEqual(expect.any(String))
    expect(data.user.updatedAt).toEqual(expect.any(String))
    expect(data.user.password).toBeUndefined()
  })

  it('should reject registration if user already exists', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'existing@example.com',
      password: 'password123',
      role: 'CLIENT'
    }

    const existingUser = {
      id: '1',
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'hashedPassword',
      role: 'CLIENT',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockDb.user.findUnique.mockResolvedValue(existingUser)

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('อีเมลนี้ถูกใช้งานแล้ว')
    expect(mockDb.user.create).not.toHaveBeenCalled()
  })

  it('should reject registration with invalid email', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
      role: 'CLIENT'
    }

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('รูปแบบอีเมลไม่ถูกต้อง')
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it('should reject registration with short name', async () => {
    const requestBody = {
      name: 'J',
      email: 'john@example.com',
      password: 'password123',
      role: 'CLIENT'
    }

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it('should reject registration with short password', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: '123',
      role: 'CLIENT'
    }

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it('should reject registration with invalid role', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'INVALID'
    }

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid')
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
  })

  it('should handle database errors gracefully', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'CLIENT'
    }

    mockDb.user.findUnique.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest(requestBody)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('เกิดข้อผิดพลาดในการสมัครสมาชิก')
  })

  it('should handle JSON parsing errors', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as NextRequest

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('เกิดข้อผิดพลาดในการสมัครสมาชิก')
  })

  it('should hash password correctly', async () => {
    const requestBody = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'CLIENT'
    }

    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: 'CLIENT',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockDb.user.findUnique.mockResolvedValue(null)
    mockBcrypt.hash.mockResolvedValue('hashedPassword')
    mockDb.user.create.mockResolvedValue(mockUser)

    const request = createMockRequest(requestBody)
    await POST(request)

    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12)
    expect(mockDb.user.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'CLIENT'
      }
    })
  })
})