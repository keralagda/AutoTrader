'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export function ProfitNotification() {
  const { user } = useAppStore()
  const { toast } = useToast()
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    // Check for new earnings every 60 seconds
    const checkEarnings = async () => {
      try {
        const since = lastChecked || new Date(Date.now() - 60000).toISOString()
        const res = await fetch(`/api/earnings?userId=${user.id}&since=${since}`)
        if (res.ok) {
          const data = await res.json()
          const recentEarnings = Array.isArray(data) ? data : data.earnings || []

          // Show toast for new earnings
          if (recentEarnings.length > 0 && lastChecked) {
            const totalNew = recentEarnings
              .filter((e: any) => new Date(e.createdAt) > new Date(lastChecked))
              .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

            if (totalNew > 0) {
              toast({
                title: '💰 Profit Credited!',
                description: `+$${totalNew.toFixed(2)} has been added to your Trading Wallet`,
              })
            }
          }
        }
        setLastChecked(new Date().toISOString())
      } catch {
        // ignore
      }
    }

    // Initial check after 5 seconds
    const initialTimer = setTimeout(checkEarnings, 5000)
    // Then check every 60 seconds
    const interval = setInterval(checkEarnings, 60000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [user?.id, lastChecked, toast])

  return null
}
