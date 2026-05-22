'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Flame, Gift, Star, Zap, CheckCircle2, Loader2 } from 'lucide-react'

interface CheckInData {
  checkedInToday: boolean
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  xp: number
  level: number
}

export function DailyCheckIn() {
  const { user, updateUserWallets } = useAppStore()
  const { toast } = useToast()
  const [data, setData] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadCheckInStatus()
  }, [user?.id])

  const loadCheckInStatus = async () => {
    try {
      const res = await fetch(`/api/daily-checkin?userId=${user?.id}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user?.id) return
    setChecking(true)
    try {
      const res = await fetch('/api/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const result = await res.json()
      if (res.ok) {
        toast({
          title: '🎉 Daily Check-in Complete!',
          description: `+${result.xpEarned} XP${result.bonusEarned > 0 ? ` • +$${result.bonusEarned.toFixed(2)} bonus` : ''} • Streak: ${result.currentStreak} days`,
        })
        setData(prev => prev ? {
          ...prev,
          checkedInToday: true,
          currentStreak: result.currentStreak,
          totalCheckIns: result.totalCheckIns,
          xp: result.totalXp,
          level: result.level,
        } : null)

        // Refresh user balance if bonus was earned
        if (result.bonusEarned > 0) {
          const meRes = await fetch(`/api/auth/me?userId=${user.id}`)
          if (meRes.ok) {
            const meData = await meRes.json()
            updateUserWallets(meData.tradingBalance, meData.withdrawalBalance)
          }
        }
      } else {
        toast({ title: result.error || 'Check-in failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' })
    } finally {
      setChecking(false)
    }
  }

  if (loading || !data) return null

  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1)

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Daily Check-in</p>
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Lv.{data.level}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400" />
                  {data.currentStreak} day streak
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {data.xp} XP
                </span>
              </div>
            </div>
          </div>

          {data.checkedInToday ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleCheckIn}
              disabled={checking}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-black"
            >
              {checking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Gift className="h-3.5 w-3.5" />
              )}
              {checking ? 'Checking...' : 'Check In'}
            </Button>
          )}
        </div>

        {/* Streak visualization */}
        <div className="flex items-center gap-1 mt-3">
          {streakDays.map((day) => (
            <div
              key={day}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                day <= data.currentStreak
                  ? 'bg-amber-400'
                  : 'bg-muted/30'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Day 1</span>
          <span className="text-[10px] text-muted-foreground">Day 7 (+$0.50)</span>
        </div>
      </CardContent>
    </Card>
  )
}
