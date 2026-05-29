'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export function LiveEarningsCounter() {
  const { user } = useAppStore()
  const [displayEarnings, setDisplayEarnings] = useState(user?.totalEarnings || 0)
  const earningsRef = useRef(user?.totalEarnings || 0)

  useEffect(() => {
    earningsRef.current = user?.totalEarnings || 0
    setDisplayEarnings(earningsRef.current)
  }, [user?.totalEarnings])

  // Only animate the counter if user has active investments AND actual earnings
  useEffect(() => {
    // Don't tick if user has no deposits or no earnings
    if (!user?.totalDeposited || user.totalDeposited <= 0) return
    if (earningsRef.current <= 0) return

    const interval = setInterval(() => {
      // Add tiny visual increment every 3 seconds (cosmetic only, not real)
      const increment = earningsRef.current * 0.00001
      setDisplayEarnings(prev => prev + increment)
    }, 3000)
    return () => clearInterval(interval)
  }, [user?.totalDeposited])

  const hasInvestment = (user?.totalDeposited || 0) > 0

  return (
    <Card className="bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 border-emerald-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {hasInvestment && earningsRef.current > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              Total Earnings
              {hasInvestment && earningsRef.current > 0 && <span className="text-emerald-400/60">(Live)</span>}
            </p>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono tabular-nums" dir="ltr">
              ${displayEarnings.toFixed(2)}
            </p>
            {!hasInvestment && (
              <p className="text-[10px] text-muted-foreground mt-1">Invest in a plan to start earning</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
