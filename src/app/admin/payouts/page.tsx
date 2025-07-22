'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import PayoutManagement from '@/components/admin/PayoutManagement'
import PayoutScheduler from '@/components/admin/PayoutScheduler'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PayoutsPage() {
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

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          จัดการการจ่ายเงิน
        </h1>
        <p className="text-neutral-600">
          อนุมัติและประมวลผลการจ่ายคอมมิชชั่นให้กับนักจิตวิทยา
        </p>
      </div>

      <Tabs defaultValue="payouts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payouts">การจ่ายเงิน</TabsTrigger>
          <TabsTrigger value="scheduler">การตั้งเวลาอัตโนมัติ</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <PayoutManagement />
        </TabsContent>

        <TabsContent value="scheduler">
          <PayoutScheduler />
        </TabsContent>
      </Tabs>
    </div>
  )
}