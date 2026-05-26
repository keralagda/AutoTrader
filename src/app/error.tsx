'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. This has been logged.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button onClick={() => window.location.href = '/'} className="gap-2">
            <Home className="h-4 w-4" /> Home
          </Button>
        </div>
      </div>
    </div>
  )
}
