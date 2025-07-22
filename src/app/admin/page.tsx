'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart3,
    CreditCard,
    DollarSign,
    FileText,
    Settings,
    Shield,
    UserCheck,
    Users
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function AdminDashboard() {
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-25 via-primary-25 to-secondary-25">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                แผงควบคุมผู้ดูแลระบบ
              </h1>
              <p className="text-neutral-600 mt-1">
                จัดการและควบคุมระบบ therajai
              </p>
            </div>
          </div>
        </div>

        {/* Admin Functions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Therapist Verification */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    ตรวจสอบนักจิตวิทยา
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                อนุมัติและปฏิเสธโปรไฟล์นักจิตวิทยาที่สมัครใหม่
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all">
                <Link href="/admin/therapist-verification">ตรวจสอบนักจิตวิทยา</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payout Management */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    จัดการการจ่ายเงิน
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                อนุมัติและประมวลผลการจ่ายคอมมิชชั่นให้นักจิตวิทยา
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all">
                <Link href="/admin/payouts">จัดการการจ่ายเงิน</Link>
              </Button>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    จัดการผู้ใช้
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full h-11 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all">
                <Link href="/admin/users">จัดการผู้ใช้</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payment Oversight */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    ดูแลการชำระเงิน
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                ติดตามและจัดการการชำระเงินทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full h-11 border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-all">
                <Link href="/admin/payments">ดูแลการชำระเงิน</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Analytics & Reports */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    รายงานและสถิติ
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                ดูสถิติและรายงานการใช้งานระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full h-11 border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <Link href="/admin/analytics">รายงานและสถิติ</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Content Management */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    จัดการเนื้อหา
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                จัดการเนื้อหาและบทความในเว็บไซต์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full h-11 border-2 border-teal-200 hover:border-teal-500 hover:bg-teal-50 transition-all">
                <Link href="/admin/content">จัดการเนื้อหา</Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    ตั้งค่าระบบ
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-neutral-600 mt-2">
                กำหนดค่าและตั้งค่าระบบต่างๆ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full h-11 border-2 border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all">
                <Link href="/admin/settings">ตั้งค่าระบบ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-neutral-900">
                สถิติด่วน
              </CardTitle>
              <CardDescription>
                ภาพรวมของระบบในช่วงเวลานี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">42</div>
                  <div className="text-sm text-muted-foreground">นักจิตวิทยารวม</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <div className="text-sm text-muted-foreground">ลูกค้ารวม</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">89</div>
                  <div className="text-sm text-muted-foreground">เซสชันเดือนนี้</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">฿45,600</div>
                  <div className="text-sm text-muted-foreground">รายได้เดือนนี้</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}