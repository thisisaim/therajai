'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from 'next-auth/react'

type Language = 'th' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation()
  const { data: session } = useSession()
  const [language, setLanguageState] = useState<Language>('en')

  // Load language preference on mount
  useEffect(() => {
    const loadLanguagePreference = () => {
      // Priority order:
      // 1. User profile preference (if logged in)
      // 2. localStorage
      // 3. Default to English
      
      let preferredLanguage: Language = 'en'
      
      if (session?.user) {
        // TODO: Get from user profile when available
        // preferredLanguage = session.user.preferredLanguage === 'ENGLISH' ? 'en' : 'th'
      }
      
      // Check localStorage as fallback
      const storedLanguage = localStorage.getItem('therajai-language') as Language
      if (storedLanguage && ['th', 'en'].includes(storedLanguage)) {
        preferredLanguage = storedLanguage
      }

      setLanguageState(preferredLanguage)
      i18n.changeLanguage(preferredLanguage)
      
      // Update document attributes
      document.documentElement.lang = preferredLanguage
      document.documentElement.dir = 'ltr' // Both Thai and English are LTR
    }

    loadLanguagePreference()
  }, [session, i18n])

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage)
    i18n.changeLanguage(newLanguage)
    
    // Persist to localStorage
    localStorage.setItem('therajai-language', newLanguage)
    
    // Update document attributes
    document.documentElement.lang = newLanguage
    document.documentElement.dir = 'ltr' // Both Thai and English are LTR
    
    // TODO: Update user profile preference if logged in
    if (session?.user) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: newLanguage === 'en' ? 'ENGLISH' : 'THAI'
          }),
        })
      } catch (error) {
        console.error('Failed to update language preference:', error)
      }
    }
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL: false, // Thai and English are both LTR
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}