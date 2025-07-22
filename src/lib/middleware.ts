import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function authenticate(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'ไม่พบการเข้าสู่ระบบ' },
      { status: 401 }
    )
  }

  return token
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const token = await authenticate(request)
  
  if (token instanceof NextResponse) {
    return token
  }

  if (!allowedRoles.includes(token.role as string)) {
    return NextResponse.json(
      { error: 'ไม่มีสิทธิ์เข้าถึง' },
      { status: 403 }
    )
  }

  return token
}

export function validateRequest(schema: any) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return validatedData
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'ข้อมูลซ้ำกันในระบบ' },
      { status: 409 }
    )
  }

  if (error.code === 'P2025') {
    return NextResponse.json(
      { error: 'ไม่พบข้อมูลที่ต้องการ' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { error: 'เกิดข้อผิดพลาดในระบบ' },
    { status: 500 }
  )
}