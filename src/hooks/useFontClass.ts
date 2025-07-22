import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export const useFontClass = (additionalClasses?: string) => {
  const { language } = useLanguage()
  
  const fontClass = language === 'th' ? 'thai-font' : 'english-font'
  
  return cn(fontClass, additionalClasses)
}

export default useFontClass