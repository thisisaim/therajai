'use client'

import React from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTranslation } from 'react-i18next'

interface LanguageToggleProps {
  variant?: 'button' | 'select'
  className?: string
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  variant = 'select',
  className = ''
}) => {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  const languages = [
    { code: 'th', label: t('language.thai'), flag: '🇹🇭' },
    { code: 'en', label: t('language.english'), flag: '🇺🇸' },
  ]

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
        className={`flex items-center gap-2 ${className}`}
        title={t('language.switchLanguage')}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">
          {language === 'th' ? '🇹🇭 TH' : '🇺🇸 EN'}
        </span>
      </Button>
    )
  }

  return (
    <Select value={language} onValueChange={(value: 'th' | 'en') => setLanguage(value)}>
      <SelectTrigger className={`w-auto min-w-[100px] ${className}`}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageToggle