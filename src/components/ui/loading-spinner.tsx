import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text = 'กำลังโหลด...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <div className="relative">
        <div className={cn(
          "border-4 border-primary-200 rounded-full",
          sizeClasses[size]
        )}></div>
        <div className={cn(
          "border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0",
          sizeClasses[size]
        )}></div>
      </div>
      {text && (
        <p className="text-sm text-neutral-600 animate-pulse thai-font">{text}</p>
      )}
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-white/20 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 rounded"></div>
        <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
      </div>
      <div className="mt-4">
        <div className="h-10 bg-neutral-200 rounded"></div>
      </div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <LoadingSpinner size="lg" text="กำลังโหลดแพลตฟอร์ม Therajai..." />
      </div>
    </div>
  )
}