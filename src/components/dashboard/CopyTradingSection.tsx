'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy, TrendingUp, Users, Crown } from 'lucide-react'

interface Trader {
  id: string
  name: string
  rank: number
  totalEarnings: number
  roi: number
  dailyAverage: number
  followers: number
}

export function CopyTradingSection() {
  const { user } = useAppStore()
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTraders()
  }, [])

  const loadTraders = async () => {
    try {
      const res = await fetch(`/api/copy-trading?userId=${user?.id}`)
      if (res.ok) {
        const data = await res.json()
        setTraders(data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (traders.length === 0) return null

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-400" />
          Top Earners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {traders.slice(0, 5).map(trader => (
          <div key={trader.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
            <span className="text-lg w-8 text-center">{getRankIcon(trader.rank)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{trader.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                  {trader.roi}% ROI
                </span>
                <span className="flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />
                  {trader.followers}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-400">${trader.totalEarnings.toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">${trader.dailyAverage}/day</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
