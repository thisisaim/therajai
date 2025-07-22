'use client'

import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import Link from "next/link"

interface ErrorDisplayProps {
  title?: string
  message?: string
  action?: () => void
  actionLabel?: string
  showHomeButton?: boolean
  className?: string
}

export function ErrorDisplay({
  title = "เกิดข้อผิดพลาด",
  message = "ขออภัยในความไม่สะดวก กรุณาลองใหม่อีกครั้ง",
  action,
  actionLabel = "ลองใหม่",
  showHomeButton = true,
  className
}: ErrorDisplayProps) {
  return (
    <div className={`min-h-[50vh] flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-error-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-neutral-900 thai-font">
            {title}
          </CardTitle>
          <CardDescription className="text-neutral-600 mt-2 thai-font">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {action && (
            <Button 
              onClick={action}
              className="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="thai-font">{actionLabel}</span>
            </Button>
          )}
          
          {showHomeButton && (
            <Button asChild variant="outline" className="w-full h-11 border-2 border-neutral-200 hover:border-neutral-500 hover:bg-neutral-50 transition-all">
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                <span className="thai-font">กลับหน้าแรก</span>
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function NotFoundDisplay() {
  return (
    <ErrorDisplay
      title="ไม่พบหน้าที่ต้องการ"
      message="หน้าที่คุณกำลังมองหาไม่มีอยู่ หรืออาจถูกย้ายไปแล้ว"
      actionLabel="กลับหน้าแรก"
      action={() => window.location.href = '/dashboard'}
      showHomeButton={false}
    />
  )
}

export function NetworkErrorDisplay({ retry }: { retry?: () => void }) {
  return (
    <ErrorDisplay
      title="ปัญหาการเชื่อมต่อ"
      message="ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      action={retry}
      actionLabel="เชื่อมต่อใหม่"
    />
  )
}

export function UnauthorizedDisplay() {
  return (
    <ErrorDisplay
      title="ไม่มีสิทธิ์เข้าถึง"
      message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบใหม่"
      actionLabel="เข้าสู่ระบบ"
      action={() => window.location.href = '/auth/login'}
      showHomeButton={false}
    />
  )
}