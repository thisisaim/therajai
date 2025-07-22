'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner'
import { useTranslation } from 'react-i18next'
import { useFontClass } from '@/hooks/useFontClass'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Video, 
  CreditCard, 
  History, 
  User, 
  Search, 
  ClipboardList, 
  BarChart3,
  Heart,
  Clock,
  MessageCircle,
  DollarSign
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const fontClass = useFontClass()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className={cn("text-neutral-600 animate-pulse", fontClass)}>{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/login')
  }

  const isClient = session.user.role === 'CLIENT'
  const isTherapist = session.user.role === 'THERAPIST'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greeting.morning')
    if (hour < 17) return t('dashboard.greeting.afternoon')
    return t('dashboard.greeting.evening')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-25 via-primary-25 to-secondary-25">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-white/20">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={cn("text-3xl font-bold text-neutral-900 animate-fade-in", fontClass)}>
                {getGreeting()}, {session.user.name}
              </h1>
              <p className={cn("text-neutral-600 mt-1", fontClass)}>
                {isClient ? t('dashboard.clientDashboard') : t('dashboard.therapistDashboard')}
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <Calendar className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className={cn("text-sm text-primary-600 font-medium", fontClass)}>{t('dashboard.stats.todaysAppointments')}</p>
              <p className="text-lg font-bold text-primary-700">2</p>
            </div>
            <div className="bg-success-50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-success-600 mx-auto mb-1" />
              <p className={cn("text-sm text-success-600 font-medium", fontClass)}>{t('dashboard.stats.completedSessions')}</p>
              <p className="text-lg font-bold text-success-700">12</p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-3 text-center">
              <MessageCircle className="w-5 h-5 text-secondary-600 mx-auto mb-1" />
              <p className={cn("text-sm text-secondary-600 font-medium", fontClass)}>{t('dashboard.stats.newMessages')}</p>
              <p className="text-lg font-bold text-secondary-700">3</p>
            </div>
            <div className="bg-warning-50 rounded-lg p-3 text-center">
              <Heart className="w-5 h-5 text-warning-600 mx-auto mb-1" />
              <p className={cn("text-sm text-warning-600 font-medium", fontClass)}>{t('dashboard.stats.progress')}</p>
              <p className="text-lg font-bold text-warning-700">85%</p>
            </div>
          </div>
        </div>

        <ProfileCompletionBanner />

        {/* Client Dashboard */}
        {isClient && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.findTherapist.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.findTherapist.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/therapists" className={fontClass}>{t('dashboard.findTherapist.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.myAppointments.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.myAppointments.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-secondary-200 hover:border-secondary-500 hover:bg-secondary-50 transition-all">
                  <Link href="/dashboard/appointments" className={fontClass}>{t('dashboard.myAppointments.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.onlineConsultation.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.onlineConsultation.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-success-200 hover:border-success-500 hover:bg-success-50 transition-all">
                  <Link href="/video-demo" className={fontClass}>{t('dashboard.onlineConsultation.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.payment.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.payment.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full h-10 border-2 border-warning-200 hover:border-warning-500 hover:bg-warning-50 transition-all">
                  <Link href="/payments" className={fontClass}>{t('dashboard.payment.viewPayments')}</Link>
                </Button>
                <Button asChild className="w-full h-10 bg-gradient-to-r from-warning-600 to-warning-700 hover:from-warning-700 hover:to-warning-800 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/payment/test-appointment-001" className={fontClass}>{t('dashboard.payment.testPayment')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.serviceHistory.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.serviceHistory.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-neutral-200 hover:border-neutral-500 hover:bg-neutral-50 transition-all">
                  <Link href="/history" className={fontClass}>{t('dashboard.serviceHistory.action')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Therapist Dashboard */}
        {isTherapist && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.therapistAppointments.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.therapistAppointments.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full h-11 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/dashboard/therapist-appointments" className={fontClass}>{t('dashboard.therapistAppointments.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.therapistSchedule.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.therapistSchedule.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-secondary-200 hover:border-secondary-500 hover:bg-secondary-50 transition-all">
                  <Link href="/dashboard/availability" className={fontClass}>{t('dashboard.therapistSchedule.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.onlineRoom.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.onlineRoom.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-success-200 hover:border-success-500 hover:bg-success-50 transition-all">
                  <Link href="/video-demo" className={fontClass}>{t('dashboard.onlineRoom.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.commission.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.commission.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/dashboard/commissions" className={fontClass}>{t('dashboard.commission.action')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                      {t('dashboard.therapistReports.title')}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
                  {t('dashboard.therapistReports.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-11 border-2 border-warning-200 hover:border-warning-500 hover:bg-warning-50 transition-all">
                  <Link href="/reports" className={fontClass}>{t('dashboard.therapistReports.action')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Section */}
        <div className="mt-8 animate-fade-in">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className={cn("text-lg font-semibold text-neutral-900", fontClass)}>
                    {t('dashboard.profile.title')}
                  </CardTitle>
                  <CardDescription className={cn("text-neutral-600 mt-1", fontClass)}>
                    {t('dashboard.profile.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-2 border-neutral-200 hover:border-neutral-500 hover:bg-neutral-50 transition-all">
                <Link href="/profile" className={fontClass}>{t('dashboard.profile.action')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}