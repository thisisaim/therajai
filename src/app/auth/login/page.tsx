'use client'

import LanguageToggle from '@/components/LanguageToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFontClass } from '@/hooks/useFontClass'
import { cn } from '@/lib/utils'
import { AlertCircle, Eye, EyeOff, Heart, Shield } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05)_0%,transparent_50%)]" />
      
      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className={cn("text-3xl font-bold text-neutral-900 mb-2", fontClass)}>therajai</h1>
          <p className={cn("text-neutral-600 text-sm", fontClass)}>{t('common.platformSubtitle')}</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader className="text-center pb-6">
            <CardTitle className={cn("text-2xl font-semibold text-neutral-900", fontClass)}>
              {t('auth.login')}
            </CardTitle>
            <CardDescription className={cn("text-neutral-600 mt-2", fontClass)}>
              {t('auth.loginSubtitle')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className={cn("text-sm font-medium text-neutral-700", fontClass)}>
                  {t('auth.email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base transition-all duration-200 border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className={cn("text-sm font-medium text-neutral-700", fontClass)}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base pr-12 transition-all duration-200 border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                    placeholder={t('auth.password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-error-600 bg-error-50 border border-error-200 rounded-lg p-3 animate-scale-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className={cn("text-sm", fontClass)}>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className={fontClass}>{t('auth.loggingIn')}</span>
                  </div>
                ) : (
                  <span className={fontClass}>{t('auth.login')}</span>
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="pt-6 border-t border-neutral-100 space-y-4">
              <div className="text-center">
                <p className={cn("text-sm text-neutral-600", fontClass)}>
                  {t('auth.noAccount')}{' '}
                  <Link 
                    href="/register" 
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors underline-offset-4 hover:underline"
                  >
                    {t('auth.register')}
                  </Link>
                </p>
              </div>
              
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className={cn("text-sm text-neutral-500 hover:text-primary-600 transition-colors underline-offset-4 hover:underline", fontClass)}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center space-x-2 text-neutral-500 pt-4">
              <Shield className="w-4 h-4" />
              <span className={cn("text-xs", fontClass)}>{t('auth.securityNotice')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-neutral-500 animate-fade-in">
          <p className={fontClass}>{t('common.copyright')}</p>
        </div>
      </div>
    </div>
  )
}