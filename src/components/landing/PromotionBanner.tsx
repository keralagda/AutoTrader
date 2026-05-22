'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Clock, Zap } from 'lucide-react'

export function PromotionBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    // Check if user dismissed before in this session
    const wasDismissed = sessionStorage.getItem('promo_dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Start fresh 30s countdown for every new visitor
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const cyclePosition = elapsed % 60 // 60 second cycle: 30s active + 30s ended

      if (cyclePosition < 30) {
        // Active countdown phase
        setEnded(false)
        setSecondsLeft(30 - cyclePosition)
      } else {
        // Ended phase
        setEnded(true)
        setSecondsLeft(60 - cyclePosition) // seconds until reset
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('promo_dismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/30 via-amber-500/30 to-primary/30 border-t border-primary/20 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <Zap className="size-4 text-amber-400 animate-pulse" />
          <span className="font-semibold">
            {ended ? (
              <span className="text-rose-400">2x Referral Bonus - Offer Ended!</span>
            ) : (
              <span className="text-amber-300">2x Referral Bonus - Limited Time!</span>
            )}
          </span>
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs rounded-full px-2.5 py-0.5 font-mono font-bold ${
            ended
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <Clock className="size-3" />
            {ended ? (
              <span>ENDED</span>
            ) : (
              <span>00:{secondsLeft.toString().padStart(2, '0')}</span>
            )}
          </div>
        </div>
        <button onClick={handleDismiss} className="absolute right-4 text-muted-foreground hover:text-foreground p-1">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
