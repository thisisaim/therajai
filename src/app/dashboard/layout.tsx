'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslation } from 'react-i18next'
import { useFontClass } from '@/hooks/useFontClass'
import {
  Calendar,
  Clock,
  User,
  BarChart3,
  Settings,
  Home,
  Users,
  Video,
  FileText
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { t } = useTranslation()
  const fontClass = useFontClass()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/login')
  }

  const isClient = session.user.role === 'CLIENT'
  const isTherapist = session.user.role === 'THERAPIST'
  const isAdmin = session.user.role === 'ADMIN'

  const clientNavItems = [
    { href: '/dashboard', label: t('navigation.home'), icon: Home },
    { href: '/dashboard/appointments', label: t('navigation.appointments'), icon: Calendar },
    { href: '/therapists', label: t('navigation.findTherapist'), icon: Users },
    { href: '/video-demo', label: t('navigation.videoCall'), icon: Video },
  ]

  const therapistNavItems = [
    { href: '/dashboard', label: t('navigation.home'), icon: Home },
    { href: '/dashboard/therapist-appointments', label: t('navigation.therapistAppointments'), icon: Calendar },
    { href: '/dashboard/availability', label: t('navigation.schedule'), icon: Clock },
    { href: '/video-demo', label: t('navigation.videoCall'), icon: Video },
  ]

  const adminNavItems = [
    { href: '/dashboard', label: t('navigation.home'), icon: Home },
    { href: '/dashboard/appointments', label: t('navigation.allAppointments'), icon: Calendar },
    { href: '/dashboard/therapist-appointments', label: t('navigation.therapistSchedule'), icon: Users },
    { href: '/dashboard/availability', label: t('navigation.schedule'), icon: Clock },
    { href: '/dashboard/reports', label: t('navigation.reports'), icon: BarChart3 },
  ]

  const navItems = isTherapist ? therapistNavItems : isClient ? clientNavItems : adminNavItems

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className={cn("text-xl font-bold text-primary-600", fontClass)}>
                Therajai
              </Link>
              
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary-100 text-primary-700" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageToggle variant="button" />
              <span className={cn("text-sm text-gray-600", fontClass)}>
                {session.user.name}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/logout" className={fontClass}>{t('navigation.logout')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                    isActive 
                      ? "bg-primary-100 text-primary-700" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}