'use client'

import { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'

interface Promotion { id: string; title: string; bannerText: string | null; endDate: string }

export function PromotionBanner() {
  const [promo, setPromo] = useState<Promotion | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    fetch('/api/promotions').then(r => r.json()).then(data => { if (Array.isArray(data) && data.length > 0) setPromo(data[0]) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!promo) return
    const update = () => {
      const diff = new Date(promo.endDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${d}d ${h}h ${m}m`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [promo])

  if (!promo || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/30 via-amber-500/30 to-primary/30 border-t border-primary/20 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="font-medium">{promo.bannerText || promo.title}</span>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground bg-background/50 rounded-full px-2 py-0.5">
            <Clock className="size-3" />
            <span>{timeLeft}</span>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="absolute right-4 text-muted-foreground hover:text-foreground p-1">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
