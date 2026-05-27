'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setTimeout(() => setShow(true), 3000)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setShow(false)
  }

  const reject = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">We use cookies</p>
            <p className="text-xs text-muted-foreground mt-1">
              We use cookies to improve your experience and analyze site traffic. By continuing, you agree to our cookie policy.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={accept} className="text-xs h-7">Accept</Button>
              <Button size="sm" variant="ghost" onClick={reject} className="text-xs h-7 text-muted-foreground">Decline</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
