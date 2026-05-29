'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'

// Silent background component that pings the API every 2 minutes to earn NP
export function ScreenTimeNP() {
  const { user } = useAppStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user?.id) return

    // Ping immediately on mount
    const ping = () => {
      fetch('/api/nova-points/screen-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {})
    }

    // First ping after 30 seconds (don't ping on immediate page load)
    const initialTimeout = setTimeout(() => {
      ping()
      // Then every 2 minutes
      intervalRef.current = setInterval(ping, 120000)
    }, 30000)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user?.id])

  // This component renders nothing - it's purely a background tracker
  return null
}
