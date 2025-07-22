'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import LanguageToggle from '@/components/LanguageToggle'
import { useFontClass } from '@/hooks/useFontClass'

export default function RegisterPage() {
  const [userType, setUserType] = useState<'client' | 'therapist' | null>(null)
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { t } = useTranslation()
  const fontClass = useFontClass()

  // Set userType from URL parameters
  useEffect(() => {
    const type = searchParams?.get('type') as 'client' | 'therapist'
    if (type === 'client' || type === 'therapist') {
      setUserType(type)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: userType?.toUpperCase()
        })
      })

      if (response.ok) {
        router.push('/auth/login?message=registered')
      } else {
        const data = await response.json()
        setError(data.error || t('auth.registerError'))
      }
    } catch (error) {
      setError(t('auth.registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className={`text-2xl text-center ${fontClass}`}>
                  {t('auth.register')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('auth.selectUserType')}
                </CardDescription>
              </div>
              <LanguageToggle variant="button" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setUserType('client')}
              className="w-full h-16 text-left"
              variant="outline"
            >
              <div>
                <div className={`font-semibold ${fontClass}`}>{t('auth.client')}</div>
                <div className="text-sm text-gray-600">{t('auth.clientDescription')}</div>
              </div>
            </Button>
            <Button
              onClick={() => setUserType('therapist')}
              className="w-full h-16 text-left"
              variant="outline"
            >
              <div>
                <div className={`font-semibold ${fontClass}`}>{t('auth.therapist')}</div>
                <div className="text-sm text-gray-600">{t('auth.therapistDescription')}</div>
              </div>
            </Button>
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                {t('auth.hasAccount')} {t('auth.signInHere')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={`text-2xl text-center ${fontClass}`}>
                {userType === 'client' ? t('auth.registerAsClient') : t('auth.registerAsTherapist')}
              </CardTitle>
              <CardDescription className="text-center">
                {t('auth.fillInformation')}
              </CardDescription>
            </div>
            <LanguageToggle variant="button" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('auth.name')}
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('auth.fullNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('auth.passwordPlaceholder')}
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('auth.confirmPasswordPlaceholder')}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('auth.registering') : t('auth.register')}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Button
              variant="ghost"
              onClick={() => setUserType(null)}
              className="text-sm"
            >
              {t('auth.backToUserType')}
            </Button>
            <p className="text-sm text-gray-600">
              {t('auth.hasAccount')}{' '}
              <Link href="/auth/login" className="text-primary-500 hover:text-primary-600">
                {t('auth.signInHere')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}