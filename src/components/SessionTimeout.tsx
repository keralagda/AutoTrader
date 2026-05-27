'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_MS = 25 * 60 * 1000 // Show warning at 25 min

export function SessionTimeout() {
  const { isAuthenticated, logout } = useAppStore()
  const [showWarning, setShowWarning] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now())
    setShowWarning(false)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity
      if (elapsed >= TIMEOUT_MS) {
        logout()
      } else if (elapsed >= WARNING_MS) {
        setShowWarning(true)
      }
    }, 10000) // Check every 10s

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearInterval(interval)
    }
  }, [isAuthenticated, lastActivity, logout, resetTimer])

  if (!isAuthenticated) return null

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Session Expiring
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your session will expire in 5 minutes due to inactivity. Click below to stay logged in.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => logout()}>Logout</Button>
          <Button onClick={resetTimer}>Stay Logged In</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
