'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { t } = useTranslation()
  const { language } = useLanguage()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-bold text-gray-900 mb-4 ${language === 'th' ? 'thai-font' : ''}`}>
            {t('home.title')}
          </h1>
          <p className={`text-xl text-gray-600 mb-8 ${language === 'th' ? 'thai-font' : ''}`}>
            {t('home.subtitle')}
          </p>
          <p className={`text-lg text-gray-500 mb-8 ${language === 'th' ? 'thai-font' : ''}`}>
            {t('home.description')}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register?type=client">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">{t('home.getStartedClient')}</Button>
            </Link>
            <Link href="/auth/register?type=therapist">
              <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">{t('home.getStartedTherapist')}</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className={`text-blue-800 ${language === 'th' ? 'thai-font' : ''}`}>{t('home.findTherapists.title')}</CardTitle>
              <CardDescription className={language === 'th' ? 'thai-font' : ''}>
                {t('home.findTherapists.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-gray-600 ${language === 'th' ? 'thai-font' : ''}`}>
                {t('home.features.smartMatching')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className={`text-blue-800 ${language === 'th' ? 'thai-font' : ''}`}>{t('home.onlineBooking.title')}</CardTitle>
              <CardDescription className={language === 'th' ? 'thai-font' : ''}>
                {t('home.onlineBooking.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-gray-600 ${language === 'th' ? 'thai-font' : ''}`}>
                {t('home.features.flexibleScheduling')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className={`text-blue-800 ${language === 'th' ? 'thai-font' : ''}`}>{t('home.securePrivate.title')}</CardTitle>
              <CardDescription className={language === 'th' ? 'thai-font' : ''}>
                {t('home.securePrivate.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-gray-600 ${language === 'th' ? 'thai-font' : ''}`}>
                {t('home.features.medicalGrade')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className={`text-3xl font-bold text-gray-900 mb-4 ${language === 'th' ? 'thai-font' : ''}`}>
            {t('home.startToday.title')}
          </h2>
          <p className={`text-gray-600 mb-8 ${language === 'th' ? 'thai-font' : ''}`}>
            {t('home.startToday.description')}
          </p>
          <Link href="/auth/login">
            <Button size="lg" className={`bg-blue-600 hover:bg-blue-700 ${language === 'th' ? 'thai-font' : ''}`}>{t('home.startToday.loginButton')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}