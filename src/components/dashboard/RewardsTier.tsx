'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Crown, Star, Zap, Trophy, Gift } from 'lucide-react'

interface RewardsData {
  stats: {
    xp: number
    level: number
    currentStreak: number
    longestStreak: number
    challengesCompleted: number
    totalUsdcRewards: number
    totalCheckIns: number
  }
  tier: string
  tierColor: string
  cashbackRate: number
  badges: { id: string; name: string; icon: string; rarity: string; earnedAt: string }[]
  availableChallenges: { id: string; title: string; reward: number; xpReward: number; difficulty: string; badgeIcon: string }[]
}

const tierThresholds = [
  { name: 'Bronze', xp: 0, color: 'text-amber-600', bg: 'bg-amber-600/20' },
  { name: 'Silver', xp: 500, color: 'text-slate-300', bg: 'bg-slate-300/20' },
  { name: 'Gold', xp: 1000, color: 'text-amber-400', bg: 'bg-amber-400/20' },
  { name: 'Platinum', xp: 2000, color: 'text-violet-300', bg: 'bg-violet-300/20' },
  { name: 'Diamond', xp: 5000, color: 'text-cyan-300', bg: 'bg-cyan-300/20' },
]

export function RewardsTier() {
  const { user } = useAppStore()
  const [data, setData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/rewards?userId=${user.id}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const currentTierIndex = tierThresholds.findIndex(t => t.name === data.tier)
  const nextTier = tierThresholds[currentTierIndex + 1]
  const currentTier = tierThresholds[currentTierIndex] || tierThresholds[0]
  const progressToNext = nextTier
    ? ((data.stats.xp - currentTier.xp) / (nextTier.xp - currentTier.xp)) * 100
    : 100

  return (
    <div className="space-y-4">
      {/* Tier Card */}
      <Card className={`border-border/50 ${currentTier.bg}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl ${currentTier.bg} flex items-center justify-center`}>
                <Crown className={`h-6 w-6 ${currentTier.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-bold ${currentTier.color}`}>{data.tier} Tier</p>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    Lv.{data.stats.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.cashbackRate}% cashback on deposits
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                {data.stats.xp} XP
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${data.stats.totalUsdcRewards.toFixed(2)} earned
              </p>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} ({nextTier.xp} XP)</span>
              </div>
              <Progress value={progressToNext} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {nextTier.xp - data.stats.xp} XP to next tier
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
          <Trophy className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold">{data.stats.challengesCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Challenges</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
          <Star className="h-4 w-4 text-violet-400 mx-auto mb-1" />
          <p className="text-sm font-bold">{data.badges.length}</p>
          <p className="text-[10px] text-muted-foreground">Badges</p>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3 text-center">
          <Gift className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold">{data.stats.totalCheckIns}</p>
          <p className="text-[10px] text-muted-foreground">Check-ins</p>
        </div>
      </div>

      {/* Badges */}
      {data.badges.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.badges.map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 border border-border/30"
                  title={badge.name}
                >
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-[10px] font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Challenges */}
      {data.availableChallenges.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.availableChallenges.slice(0, 3).map(challenge => (
              <div key={challenge.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{challenge.badgeIcon}</span>
                  <div>
                    <p className="text-xs font-medium">{challenge.title}</p>
                    <Badge variant="outline" className="text-[9px] mt-0.5">{challenge.difficulty}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  {challenge.reward > 0 && <p className="text-xs text-emerald-400">${challenge.reward}</p>}
                  <p className="text-[10px] text-muted-foreground">+{challenge.xpReward} XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
