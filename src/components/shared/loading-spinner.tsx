import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export function LoadingSpinner({ className, size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const spinner = (
    <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)} />
  )

  if (fullScreen) {
    return (
      <div className="flex h-96 items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner />
    </div>
  )
}
