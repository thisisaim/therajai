'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useFontClass } from '@/hooks/useFontClass'
import { cn } from '@/lib/utils'
import LanguageToggle from '@/components/LanguageToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { t } = useTranslation()
  const fontClass = useFontClass()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError(t('auth.invalidCredentials'))
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError(t('auth.loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className={cn("text-2xl text-center", fontClass)}>{t('auth.login')}</CardTitle>
          <CardDescription className={cn("text-center", fontClass)}>
            {t('auth.loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={cn("block text-sm font-medium text-gray-700", fontClass)}>
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn("mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500", fontClass)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className={cn("block text-sm font-medium text-gray-700", fontClass)}>
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500", fontClass)}
                placeholder={t('auth.password')}
              />
            </div>
            {error && (
              <div className={cn("text-red-600 text-sm", fontClass)}>{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              <span className={fontClass}>
                {isLoading ? t('auth.loggingIn') : t('auth.login')}
              </span>
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <p className={cn("text-sm text-gray-600", fontClass)}>
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary-500 hover:text-primary-600">
                {t('auth.register')}
              </Link>
            </p>
            <Link
              href="/auth/forgot-password"
              className={cn("text-sm text-primary-500 hover:text-primary-600", fontClass)}
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}