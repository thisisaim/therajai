'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import CommissionDashboard from '@/components/dashboard/CommissionDashboard'

export default function CommissionsPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'THERAPIST') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          รายได้และคอมมิชชั่น
        </h1>
        <p className="text-neutral-600">
          ติดตามรายได้จากการให้บริการและการจ่ายเงิน
        </p>
      </div>

      <CommissionDashboard therapistId={session.user.id} />
    </div>
  )
}