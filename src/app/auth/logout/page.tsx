'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogoutPage() {
  useEffect(() => {
    // Sign out and redirect to login
    signOut({ 
      callbackUrl: '/auth/login',
      redirect: true 
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="thai-font">กำลังออกจากระบบ</CardTitle>
          <CardDescription>
            กรุณารอสักครู่...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </CardContent>
      </Card>
    </div>
  )
}